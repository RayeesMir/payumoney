var request = require('request'),
	queryString = require('querystring'),
	crypto = require('crypto');

var BASE_URL= 'https://test.payumoney.com';
var CREATE_PAYEMENT= 'https://test.payu.in/_payment';

var ENDPOINTS = {		
	'PAYEMENT_DETAILS': '/payment/op/getPaymentResponse?',
	'PAYMENT_STATUS': '/payment/payment/chkMerchantTxnStatus?',
	'INITIATE_REFUND': '/payment/merchant/refundPayment?',
	'REFUND_DETAILS': '/treasury/ext/merchant/getRefundDetailsByPayment?',
	'EMAIL_INVOICE': '/payment/payment/addInvoiceMerchantAPI?',
	'SMS_INVOICE': '/payment/payment/smsInvoice?'
};

module.exports = {
	HEADERS: {
		'Authorization': '',
		'Content-Type': '',
		'Content-Length': '',
		'content': '',
		'accept': ''
	},
	hashSequence: "key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10",
	setHeaders: function(auth, contentLength, contentData) {
		this.HEADERS['Authorization'] = auth;
		this.HEADERS['Content-Type'] = 'application/json';
		this.HEADERS['Content-Length'] = contentLength;
		this.HEADERS['content'] = contentData;
		this.HEADERS['accept'] = '*/*';
	},
	caller: function(url, method, header, callback) {
		request({
			method: method,
			url: url,
			headers: header
		}, function(error, result, body) {
			if (!error && result.statusCode === 200)
				body = JSON.parse(body)
			callback(error, result, body);
		})
	},
	paymentFields: function() {
		return ({
			'key': '',
			'txnid': '',
			'firstname': '',
			'lastname': '',
			'email': '',
			'phone': '',
			'productinfo': '',
			'amount': '',
			'surl': '',
			'furl': '',
			'hash': '',
			'service_provider': 'payu_paisa',
			'address1': '',
			'address2': '',
			'city': '',
			'state': '',
			'country': '',
			'zipcode': '',
			'udf1': '',
			'udf2': '',
			'udf3': '',
			'udf4': '',
			'udf5': '',
			'udf6': '',
			'udf7': '',
			'udf8': '',
			'udf9': '',
			'udf10': '',
		});
	},	
	hashBeforeTransaction: function(data, salt, callback) {
		var key = "",
			string = "";
		var sequence = this.hashSequence.split('|');		
		if (!(data && salt))
			return "Data and Salt Required";		
		for (var i = 0; i < sequence.length; i++) {
			key = sequence[i];
			string += data[key] + '|';
		}
		string += salt;
		return callback(crypto.createHash('sha512', salt).update(string).digest('hex'));
	},
	hashAfterTransaction:function(data, salt, transactionStatus,callback){
		var key = "",
			string = "";
		var sequence = this.hashSequence.split('|').reverse();
		if (!(data && salt && transactionStatus)) 
			return "Data, Salt, and TransactionStatus Required";
		string += salt + '|' + transactionStatus + '|';
		for (var i = 0; i < sequence.length; i++) {
			key = sequence[i];
			string += data[key] + '|';
		}
		string = string.substr(0, string.length - 1);			
		return callback(crypto.createHash('sha512', salt).update(string).digest('hex'));
	},
	getPaymentDetails: function(auth, data, callback) {
		var string = "";
		data.transactionIds.forEach(function(merchantId) {
			string = merchantId + "|";
		});
		string = string.substr(0, string.length - 1);
		var qs = queryString.stringify({
			merchantKey: data.key,
			merchantTransactionIds: string,
			from: data.from,
			to: data.to,
			count: data.numberOfPayments
		});
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.PAYEMENT_DETAILS + qs;
		this.caller(url, 'POST', header, callback);

	},
	transactionStatus: function(auth, data, callback) {
		var string = "";
		data.transactionIds.forEach(function(merchantId) {
			string = merchantId + "|";
		});
		string = string.substr(0, string.length - 1);
		var qs = queryString.stringify({
			merchantKey: data.key,
			merchantTransactionIds: string
		});
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.PAYMENT_STATUS + qs;
		this.caller(url, 'POST', header, callback);
	},
	initiateRefund: function(auth, data, callback) {
		var qs = queryString.stringify({
			merchantKey: data.key,
			paymentId: data.paymentId,
			refundAmount: data.amount
		});
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.INITIATE_REFUND + qs;
		this.caller(url, 'POST', header, callback);
	},
	paymentRefundDetails: function(auth, data, callback) {
		var qs = queryString.stringify({
			merchantKey: data.key,
			paymentId: data.paymentId
		});
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.REFUND_DETAILS + qs;
		this.caller(url, 'POST', header, callback);
	},
	refundDetails: function(auth, data, callback) {
		var qs = queryString.stringify({
			merchantKey: data.key,
			refundId: data.refundId
		});
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.REFUND_DETAILS + qs;
		this.caller(url, 'GET', header, callback);
	},
	emailInvoice: function(auth, data, callback) {
		var qs = queryString.stringify({
			customerName: data.name,
			customerEmail: data.email,
			customerPhone: data.phone,
			amount: data.amount,
			paymentDescription: data.description,
			transactionId: data.transactionId,
			sendEmail: data.sendEmail,
			expiryTime:data.expiry
		})
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.EMAIL_INVOICE + qs;
		this.caller(url, 'POST', header, callback)
	},
	smsInvoice: function(auth, data, callback) {
		var qs = queryString.stringify({
			customerName: data.name,
			customerMobileNumber: data.phone,
			amount: data.amount,
			description: data.description,
			invoiceReferenceId: data.transactionId,
			confirmSMSPhone: data.confirmPhone
		});
		this.setHeaders(auth, Buffer.byteLength(qs), qs);
		var header = this.HEADERS;
		var url = BASE_URL + ENDPOINTS.SMS_INVOICE + qs;
		this.caller(url, 'POST', header, callback);
	}
};