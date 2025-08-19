package com.recepcao.correspondencia.services;

import com.recepcao.correspondencia.clients.ConexaClients;
import com.recepcao.correspondencia.dto.CorrespondenciaResponse;
import com.recepcao.correspondencia.config.APIExceptions;
import com.recepcao.correspondencia.dto.responses.CustomerResponse;
import com.recepcao.correspondencia.entities.*;
import com.recepcao.correspondencia.mapper.CustomerResponseMapper;
import com.recepcao.correspondencia.mapper.EmpresaMapper;
import com.recepcao.correspondencia.mapper.enums.Situacao;
import com.recepcao.correspondencia.mapper.enums.StatusCorresp;
import com.recepcao.correspondencia.mapper.enums.StatusEmpresa;
import com.recepcao.correspondencia.repositories.CorrespondenciaRepository;
import com.recepcao.correspondencia.repositories.CustomerRepository;
import com.recepcao.correspondencia.repositories.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.recepcao.correspondencia.dto.CorrespondenciaComEmpresaDTO;

@Service
@RequiredArgsConstructor
public class CorrespondenciaService {

    private static final Logger log = LoggerFactory.getLogger(CorrespondenciaService.class);

    private final CorrespondenciaRepository correspondenciaRepository;
    private final EmpresaRepository empresaRepository;
    private final ConexaClients conexaClient;
    private final EmailService emailService;
    // enderecoValidatorService removido porque não é utilizado neste serviço
    private final HistoricoService historicoService;
    private final CustomerRepository customerRepository;


    public CorrespondenciaResponse listarTodas(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {

        // Validate sortBy field exists in the entity
        if (!isValidSortField(sortBy)) {
            sortBy = "id"; // Default to id if invalid field
        }

        Sort sortByAndOrder = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageDetails = PageRequest.of(pageNumber, pageSize, sortByAndOrder);
        Page<Correspondencia> correspondenciaPage = correspondenciaRepository.findAll(pageDetails);

        List<Correspondencia> correspondenciaPageContent = correspondenciaPage.getContent();

        // Always return a response, even if empty
        CorrespondenciaResponse correspondenciaResponse = new CorrespondenciaResponse();
        correspondenciaResponse.setContent(correspondenciaPageContent);
        correspondenciaResponse.setPageNumber(correspondenciaPage.getNumber());
        correspondenciaResponse.setPageSize(correspondenciaPage.getSize());
        correspondenciaResponse.setTotalElements(correspondenciaPage.getTotalElements());
        correspondenciaResponse.setTotalPages(correspondenciaPage.getTotalPages());
        correspondenciaResponse.setLastPage(correspondenciaPage.isLast());

        return correspondenciaResponse;

    }

    /**
     * Validates if the sort field exists in the Correspondencia entity
     */
    private boolean isValidSortField(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return false;
        }
        
        // Valid fields in Correspondencia entity
        String[] validFields = {"id", "remetente", "nomeEmpresaConexa", "statusCorresp", "dataRecebimento", "dataAvisoConexa", "fotoCorrespondencia"};
        for (String field : validFields) {
            if (field.equalsIgnoreCase(sortBy)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Consulta no Conexa buscando por nome da empresa
     */
    public List<CustomerResponse> verificarEmpresaConexa(String nomeEmpresa) {
        List<CustomerResponse> todasEmpresas = conexaClient.buscarEmpresasPorNome(nomeEmpresa);
        if (todasEmpresas == null || todasEmpresas.isEmpty()) return List.of();

        String nomeBusca = nomeEmpresa.toLowerCase();
        return todasEmpresas.stream()
                .filter(e -> (e.getName() != null && e.getName().toLowerCase().contains(nomeBusca))
                        || (e.getFirstName() != null && e.getFirstName().toLowerCase().contains(nomeBusca)))
                .collect(Collectors.toList());
    }

    public Correspondencia processarCorrespondencia(Correspondencia correspondencia) {
    log.debug("Iniciando processamento de correspondencia para empresa='{}' remetente='{}'", correspondencia.getNomeEmpresaConexa(), correspondencia.getRemetente());
    List<CustomerResponse> empresasEncontradas = verificarEmpresaConexa(correspondencia.getNomeEmpresaConexa());
    log.debug("Resultado da busca no Conexa ({} resultados) para '{}'", empresasEncontradas.size(), correspondencia.getNomeEmpresaConexa());
        correspondencia.setDataRecebimento(LocalDate.now());

        if (!empresasEncontradas.isEmpty()) {
            CustomerResponse customer = empresasEncontradas.get(0);

            // Verificar se o customer já existe antes de salvar
            Optional<Customer> customerExistente = customerRepository.findById(customer.getCustomerId());
            if (customerExistente.isEmpty()) {
                Customer customerEntity = CustomerResponseMapper.fromCustomerResponse(customer);
                Customer savedCustomer = customerRepository.save(customerEntity);
                log.debug("Customer salvo no banco com id={} name={}", savedCustomer.getId(), savedCustomer.getName());
            }

            if (customer.getLegalPerson() == null || customer.getLegalPerson().getCnpj() == null || customer.getLegalPerson().getCnpj().isEmpty()) {
                // Empresa sem CNPJ (provavelmente CPF) - exige aditivo contratual
                correspondencia.setStatusCorresp(StatusCorresp.ANALISE);

                // Verificar se a empresa já existe antes de salvar
                Optional<Empresa> empresaExistente = empresaRepository.findByNomeEmpresa(customer.getName());
                Empresa empresaSalva;
                
                if (empresaExistente.isEmpty()) {
                    Empresa novaEmpresa = EmpresaMapper.fromCustomerResponse(customer);
                    novaEmpresa.setStatusEmpresa(StatusEmpresa.FALTA_ADITIVO);
                    novaEmpresa.setSituacao(Situacao.CPF);
                    novaEmpresa.setMensagem("Necessário aditivo contratual para alterar CPF para CNPJ");
                    empresaSalva = empresaRepository.save(novaEmpresa);
                    log.debug("Empresa criada (sem CNPJ) id={} nome={}", empresaSalva.getId(), empresaSalva.getNomeEmpresa());
                } else {
                    empresaSalva = empresaExistente.get();
                    log.debug("Empresa já existe (sem CNPJ) id={} nome={}", empresaSalva.getId(), empresaSalva.getNomeEmpresa());
                }

               emailService.enviarEmailSolicitandoAditivo(
                        customer.getEmailsMessage() != null ? "gabrielathenaoffice@gmail.com" : null,
                        customer.getName()
                );

                historicoService.registrar(
                        "Empresa",
                        empresaSalva.getId(),
                        "Aviso de Aditivo Enviado",
                        "Enviado e-mail solicitando mudança de CPF para CNPJ."
                );


            } else {
                // Empresa já possui CNPJ - fluxo normal
                correspondencia.setStatusCorresp(StatusCorresp.ANALISE);

                // Verificar se a empresa já existe antes de salvar
                Optional<Empresa> empresaExistente = empresaRepository.findByNomeEmpresa(customer.getName());
                Empresa empresaSalva;
                
                if (empresaExistente.isEmpty()) {
                    Empresa novaEmpresa = EmpresaMapper.fromCustomerResponse(customer);
                    empresaSalva = empresaRepository.save(novaEmpresa);
                    log.debug("Empresa criada id={} nome={}", empresaSalva.getId(), empresaSalva.getNomeEmpresa());
                } else {
                    empresaSalva = empresaExistente.get();
                    log.debug("Empresa já existe id={} nome={}", empresaSalva.getId(), empresaSalva.getNomeEmpresa());
                }

                /*emailService.enviarEmailAvisoCorrespondencia(
                        customer.getEmailsMessage() != null ? customer.getEmailsMessage().getFirst() : null,
                        customer.getName()
                );*/

                historicoService.registrar(
                        "Correspondencia",
                        empresaSalva.getId(),
                        "Aviso de Correspondência",
                        "Correspondência informada ao cliente '" + customer.getName() + "'."
                );

            }

            // ABAIXO É O METODO DE PESQUISA FORA DO CONEXA
        } else {
            // Caso não tenha vínculo no Conexa, verifica se o endereço pertence à Athena
            // Aqui depois substituir por consulta Assertiva/Leme/Google


            if (correspondencia.getNomeEmpresaConexa().isEmpty()) {

                /*// Uso indevido do endereço
                correspondencia.setStatusCorresp(StatusCorresp.USO_INDEVIDO);

                // Aqui futuramente: gerar alerta interno / protesto
                emailService.enviarEmailUsoIndevido("gabrielathenaoffice@gmail.com",
                        correspondencia.getNomeEmpresaConexa()
                );*/

                Correspondencia salvo = correspondenciaRepository.save(correspondencia);

                historicoService.registrar(
                        "Correspondencia",
                        salvo.getId(),
                        "Recebimento de Correspondência sem nome cadastrado",
                        "Correspondência recebida através do remetente '" + salvo.getRemetente() + "' mas não houve destino inserido."
                );

                return salvo;


            } else {
                // Endereço não é da Athena - devolução normal
                correspondencia.setStatusCorresp(StatusCorresp.DEVOLVIDA);

                historicoService.registrar(
                        "Correspondencia",
                        correspondencia.getId(),
                        "Sem uso de quaisquer endereço",
                        "Correspondência recebida da empresa '" + correspondencia.getNomeEmpresaConexa() + "' que possa estar utilizando endereço da Athena."
                );
            }


        }

        return correspondenciaRepository.save(correspondencia);
    }


    public Correspondencia alterarStatusCorrespondencia(Long id, StatusCorresp novoStatus) {
        Correspondencia correspondencia = correspondenciaRepository.findById(id)
                .orElseThrow(() -> new APIExceptions("Correspondência não encontrada com ID: " + id));

        StatusCorresp statusAnterior = correspondencia.getStatusCorresp();
        correspondencia.setStatusCorresp(novoStatus);
        Correspondencia atualizada = correspondenciaRepository.save(correspondencia);

        historicoService.registrar(
                "Correspondencia",
                atualizada.getId(),
                "Status alterado",
                "Status alterado de '" + statusAnterior + "' para '" + novoStatus + "'."
        );

        return atualizada;
    }

    /**
     * Lista correspondências com dados da empresa associada
     */
    public List<CorrespondenciaComEmpresaDTO> listarComEmpresa(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        Sort sortByAndOrder = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageDetails = PageRequest.of(pageNumber, pageSize, sortByAndOrder);
        Page<Correspondencia> correspondenciaPage = correspondenciaRepository.findAll(pageDetails);

        return correspondenciaPage.getContent().stream()
                .map(this::mapearParaDTOComEmpresa)
                .collect(Collectors.toList());
    }

    /**
     * Mapeia correspondência para DTO com dados da empresa
     */
    private CorrespondenciaComEmpresaDTO mapearParaDTOComEmpresa(Correspondencia correspondencia) {
        CorrespondenciaComEmpresaDTO dto = new CorrespondenciaComEmpresaDTO();
        dto.setId(correspondencia.getId());
        dto.setRemetente(correspondencia.getRemetente());
        dto.setNomeEmpresaConexa(correspondencia.getNomeEmpresaConexa());
        dto.setStatusCorresp(correspondencia.getStatusCorresp() != null ? correspondencia.getStatusCorresp().name() : null);
        dto.setDataRecebimento(correspondencia.getDataRecebimento());
        dto.setDataAvisoConexa(correspondencia.getDataAvisoConexa());
        dto.setFotoCorrespondencia(correspondencia.getFotoCorrespondencia());

        // Buscar dados da empresa se existir
        if (correspondencia.getNomeEmpresaConexa() != null && !correspondencia.getNomeEmpresaConexa().isEmpty()) {
            String nomeBusca = correspondencia.getNomeEmpresaConexa().trim();
            Optional<Empresa> empresa = empresaRepository.findByNomeEmpresa(nomeBusca);
            
            if (empresa.isPresent()) {
                Empresa emp = empresa.get();
                dto.setNomeEmpresa(emp.getNomeEmpresa());
                dto.setCnpj(emp.getCnpj());
                dto.setEmail(emp.getEmail());
                dto.setTelefone(emp.getTelefone());
                dto.setStatusEmpresa(emp.getStatusEmpresa() != null ? emp.getStatusEmpresa().name() : null);
                dto.setSituacao(emp.getSituacao() != null ? emp.getSituacao().name() : null);
                dto.setMensagem(emp.getMensagem());
            }
        }

        return dto;
    }

    /**
     * Busca histórico por ação realizada
     */
    public List<HistoricoInteracao> buscarHistoricoPorAcao(String acaoRealizada) {
        return null; // historicoRepository.findByAcaoRealizadaContainingIgnoreCase(acaoRealizada);
    }

    /**
     * Atualiza a data de aviso de uma correspondência
     */
    public Correspondencia atualizarDataAviso(Long id, LocalDate dataAviso) {
        Correspondencia correspondencia = correspondenciaRepository.findById(id)
                .orElseThrow(() -> new APIExceptions("Correspondência não encontrada com ID: " + id));

        correspondencia.setDataAvisoConexa(dataAviso);
        Correspondencia atualizada = correspondenciaRepository.save(correspondencia);

        historicoService.registrar(
                "Correspondencia",
                atualizada.getId(),
                "Data de Aviso Atualizada",
                "Data de aviso alterada para: " + dataAviso
        );

        return atualizada;
    }

    public void apagarCorrespondencia(Long id){
        Correspondencia correspondencia = correspondenciaRepository.findById(id)
                .orElseThrow(() -> new APIExceptions("Correspondência não encontrada com ID: " + id));
        correspondenciaRepository.delete(correspondencia);
    }

}
