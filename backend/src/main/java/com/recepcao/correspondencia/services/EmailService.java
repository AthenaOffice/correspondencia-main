package com.recepcao.correspondencia.services;

import com.recepcao.correspondencia.config.EmailConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailConfig emailConfig;

    public void enviarEmailSolicitandoAditivo(String emailDestino, String nomeEmpresa) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailConfig.getRemetente());
        message.setTo(emailDestino);
        message.setSubject("Aditivo Contratual Necessário - Athena Office");
        message.setText("Olá, " + nomeEmpresa + ".\n\n" +
                "Identificamos que sua empresa está vinculada como CPF no nosso sistema. " +
                "Pedimos, por gentileza, que entre em contato com o setor financeiro da Athena Office " +
                "para realizar a atualização para CNPJ e regularizar seu contrato.\n\n" +
                "Atenciosamente,\nEquipe Athena Office");

        mailSender.send(message);
    }

    public void enviarEmailUsoIndevido(String emailDestino, String nomeEmpresa) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailConfig.getRemetente());
        message.setTo(emailDestino);
        message.setSubject("⚠️ Uso Indevido de Endereço Fiscal - Athena Office");
        message.setText("Alerta: Identificamos que a empresa \"" + nomeEmpresa + "\" está utilizando um endereço da Athena Office sem contrato ativo.\n" +
                "Favor verificar e tomar as providências cabíveis.");

        mailSender.send(message);
    }


    public void enviarEmailAvisoCorrespondencia(String emailDestino, String nomeEmpresa) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailConfig.getRemetente());
        message.setTo(emailDestino);
        message.setSubject("Athena Office - Correspondência");
        message.setText("");

        mailSender.send(message);
    }
}

