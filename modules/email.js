/**
 * @Description 邮件发送 
 * 调用方法:sendMail('xxx@xx.com','这是测试邮件', '这是一封测试邮件');
 */
var nodemailer = require('nodemailer');
//配置邮件服务器 
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('./config.js');
//把配置好的选项作为参数传递给nodemailer，去创建一个实例 
smtpTransport = nodemailer.createTransport(smtpTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
}));

/**
 * @param {String} recipient 收件人
 * @param {String} subject 发送的主题
 * @param {String} html 发送的html内容
 */
var sendMail = function (recipient, subject, html, cb) {

    smtpTransport.sendMail({

        from: config.email.user,
        to: recipient,
        subject: subject,//邮件标题
        html: html//邮件内容

    }, cb);
}

module.exports = sendMail;