var config   = require('../../storm/multilang/resources/config');
var Logger   = require('../../storm/multilang/resources/src/lib/modules/logger');
var log      = new Logger({scope : 'get payments'});
var moment   = require('moment');
var response = require('response');

var accountPayments = function(hbase) {
  self = this;

self.getPayments = function (req, res, next) {
  var options = prepareOptions();

  if (options.error) {
    errorResponse(options);
    return;

  } else {
    log.info("PAYMENTS: " + options.account);

    hbase.getPayments(options, function(err, payments) {
      if (err) {
        errorResponse(err);
      } else {
        payments.forEach(function(p) {
          delete p.rowkey;
          delete p.tx_index;
        });

        successResponse(payments);
      }
    });

    return;
  }

  function prepareOptions() {
    var options = {
      account    : req.params.address,
      start      : req.query.start,
      end        : req.query.end,
      descending : (/false/i).test(req.query.descending) ? false : true,
      limit      : Number(req.query.limit) || 200,
    }

    if (!options.end)   options.end   = moment.utc('9999-12-31');
    if (!options.start) options.start = moment.utc(0);
    if (options.limit > 1000) {
      return {error:'limit cannot exceed 1000', code:400};
    }

    return options;
  }

  /**
  * errorResponse
  * return an error response
  * @param {Object} err
  */
  function errorResponse (err) {
    if (err.code.toString()[0] === '4') {
      log.error(err.error || err);
      response.json({result:'error', message:err.error}).status(err.code).pipe(res);
    } else {
      response.json({result:'error', message:'unable to retrieve payments'}).status(500).pipe(res);
    }
  }

  /**
  * successResponse
  * return a successful response
  * @param {Object} payments
  */
  function successResponse (payments) {
    var result = {
      result   : "sucess",
      count    : payments.length,
      payments : payments
    };

    response.json(result).pipe(res);
  }

};

  return this;
}

module.exports = function(db) {
  ap = accountPayments(db);
  return ap.getPayments;
};
