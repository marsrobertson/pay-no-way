var app = app || {};

app.util = (function() {

	'use strict';

	return {

		extend: function() {

			var args = Array.prototype.slice.call(arguments);
			return _.extend.apply(_, [{}].concat(args));
		},

		renderQrCode: function($target, data, options, cb) {

			if (_.isFunction(options)) {
				cb = options;
				options = null;
			}

			options = options || {};

			app.util.generateQrCodeDataUri(data, options, function(error, dataUri) {

				if (error) {
					return cb && cb(error);
				}

				window.requestAnimationFrame(function() {

					var css = {
						'background-image': 'url(' + dataUri + ')',
						'background-repeat': 'no-repeat',
						'background-position': 'center center',
					};

					if (options.width) {
						css['background-size'] = [
							options.width + 'px',
							options.width + 'px'
						].join(' ');
					}

					$target.css(css);
					cb && cb();
				});
			});
		},

		generateQrCodeDataUri: function(data, options, cb) {

			if (_.isFunction(options)) {
				cb = options;
				options = null;
			}

			options = _.defaults(options || {}, {
				errorCorrectionLevel: app.config.qrCodes.errorCorrectionLevel,
				margin: app.config.qrCodes.margin,
				type: 'image/jpeg',
				rendererOpts: {
					quality: 1,
				},
			});

			QRCode.toDataURL(data, options, cb);
		},

		generateRandomString: function(length, charset) {

			var randString = '';

			charset = charset || 'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ1234567890';

			var randomValues = app.util.getRandomValues(length);

			for (var index = 0; index < length; index++) {
				randString += charset[randomValues[index] % charset.length];
			}

			return randString;
		},

		getRandomValues: function(length) {

			var randomValues;

			if (window.crypto && window.crypto.getRandomValues) {
				// For the latest browsers.
				randomValues = new Uint32Array(length);
				window.crypto.getRandomValues(randomValues);
			} else {
				// Fallback to using the SJCL library.
				randomValues = sjcl.random.randomWords(length);
			}

			return randomValues;
		},

		formatNumber: function(number, format) {

			if (!number) return '';
			format = format || 'default';
			var config = this.getNumberFormatConfig(format);
			BigNumber.config(config.BigNumber);
			try {
				number = (new BigNumber(number)).toFormat(config.decimals);
			} catch (error) {
				app.log(error);
				return '';
			}
			return number;
		},

		getNumberFormatConfig: function(format) {

			return _.defaults(app.config.numberFormats[format] || {}, app.config.numberFormats['default']);
		},

		formatDate: function(datetime, format) {

			format = format || app.settings.get('dateFormat');
			return moment(datetime).format(format);
		},

		parsePaymentRequest: function(payReq) {

			if (!payReq) return null;
			if (payReq.indexOf(':') === -1) {
				throw new Error(app.i18n.t('util.invalid-payment-request'));
			}
			var parts = payReq.split(':');
			var network = parts[0];
			var address, amount;
			if (parts[1].indexOf('?') !== -1) {
				var moreParts = parts[1].split('?');
				var params = querystring.parse(moreParts[1]);
				address = moreParts[0];
				amount = params.amount;
			} else {
				address = parts[1];
				amount = 0;
			}
			var parsed = {
				network: network,
				address: address,
				amount: amount,
			};
			return parsed;
		},

	};

})();
