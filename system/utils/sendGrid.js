const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgClient.setApiKey(process.env.SENDGRID_API_KEY);

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

// exports.sendEmail = () => {
// 	const msg = {
// 		to: 'a_kellock@hotmail.com', // Change to your recipient
// 		from: 'andy@jemu-chat.com', // Change to your verified sender
// 		subject: 'Sending with SendGrid is Fun',
// 		text: 'and easy to do anywhere, even with Node.js',
// 		html: '<strong>and easy to do anywhere, even with Node.js</strong>',
// 	};
// 	sgMail
// 		.send(msg)
// 		.then(() => {
// 			console.log('Email sent');
// 		})
// 		.catch((error) => {
// 			console.error(error);
// 		});
// };

exports.sendEmail = (templateId, user, templateData) => {
	const msg = {
		to: {
			email: user.email,
			name: `${user.firstName} ${user.lastName}`,
		},
		from: { email: process.env.EMAIL_FROM, name: 'Jemu-Chat' },
		reply_to: {
			email: process.env.EMAIL_REPLY_TO,
			name: 'noreply',
		},
		templateId: templateId,
		dynamic_template_data: templateData,
		mail_settings: {
			bypass_spam_management: { enable: true },
		},
	};

	sgMail.send(msg).catch((err) => {
		console.log(err);
	});
};

// exports.addToContacts = (user) => {
// 	const options = {
// 		method: 'PUT',
// 		url: '/v3/marketing/contacts',
// 		body: {
// 			list_ids: ['96b8cdcb-1085-4402-ad5c-ec88a69be3d6'],
// 			contacts: [
// 				{
// 					first_name: user.firstName,
// 					last_name: user.lastName,
// 					email: user.email,
// 				},
// 			],
// 		},
// 	};

// 	sgClient.request(options).catch((err) => {
// 		console.log(err.response.body);
// 	});
// };

// exports.contactUs = (message) => {
// 	const msg = {
// 		//to: 'e416a6c1.laurusonline.school@jp.teams.ms',
// 		to: { email: process.env.EMAIL_SUPPORT_TO },
// 		//to: 'takashi.ito@laurus-school.com',
// 		//from: 'takashi@laurusonline.school',
// 		from: { email: process.env.EMAIL_FROM, name: 'eLaurus' },
// 		subject: '[eLaurus] Message from Contact Us form',
// 		text: message,
// 	};
// 	sgMail.send(msg).catch((err) => {
// 		console.log(err.toString());
// 	});
// };

// exports.contactUsAutoReply = (templateId, templateData) => {
// 	const msg = {
// 		to: {
// 			email: templateData.email,
// 			name: templateData.name,
// 		},
// 		from: { email: process.env.EMAIL_FROM, name: 'eLaurus' },
// 		reply_to: {
// 			email: process.env.EMAIL_REPLY_TO,
// 			name: 'eLaurus Support',
// 		},
// 		templateId: templateId,
// 		dynamic_template_data: templateData,
// 		mail_settings: {
// 			bypass_spam_management: { enable: true },
// 		},
// 	};

// 	sgMail.send(msg).catch((err) => {
// 		console.log(err);
// 	});
// };
