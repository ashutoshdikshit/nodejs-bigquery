/*!
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*!
 * @module bigquery/job
 */

'use strict';

var common = require('@google-cloud/common');
var {promisifyAll} = require('@google-cloud/promisify');
var extend = require('extend');
var is = require('is');
var util = require('util');

/**
 * Job objects are returned from various places in the BigQuery API:
 *
 * - {@link BigQuery#getJobs}
 * - {@link BigQuery#job}
 * - {@link BigQuery#query}
 * - {@link BigQuery#createJob}
 * - {@link BigQuery/table#copy}
 * - {@link BigQuery/table#createWriteStream}
 * - {@link BigQuery/table#extract}
 * - {@link BigQuery/table#load}
 *
 * They can be used to check the status of a running job or fetching the results
 * of a previously-executed one.
 *
 * @class
 * @param {BigQuery} bigQuery {@link BigQuery} instance.
 * @param {string} id The ID of the job.
 * @param {object} [options] Configuration object.
 * @param {string} [options.location] The geographic location of the job.
 *      Required except for US and EU.
 *
 * @example
 * const BigQuery = require('@google-cloud/bigquery');
 * const bigquery = new BigQuery();
 *
 * const job = bigquery.job('job-id');
 *
 * //-
 * // All jobs are event emitters. The status of each job is polled
 * // continuously, starting only after you register a "complete" listener.
 * //-
 * job.on('complete', function(metadata) {
 *   // The job is complete.
 * });
 *
 * //-
 * // Be sure to register an error handler as well to catch any issues which
 * // impeded the job.
 * //-
 * job.on('error', function(err) {
 *   // An error occurred during the job.
 * });
 *
 * //-
 * // To force the Job object to stop polling for updates, simply remove any
 * // "complete" listeners you've registered.
 * //
 * // The easiest way to do this is with `removeAllListeners()`.
 * //-
 * job.removeAllListeners();
 */
function Job(bigQuery, id, options) {
  if (options && options.location) {
    this.location = options.location;
  }

  var methods = {
    /**
     * Check if the job exists.
     *
     * @method Job#exists
     * @param {function} [callback] The callback function.
     * @param {?error} callback.err An error returned while making this
     *     request.
     * @param {boolean} callback.exists Whether the job exists or not.
     * @returns {Promise}
     *
     * @example
     * const BigQuery = require('@google-cloud/bigquery');
     * const bigquery = new BigQuery();
     *
     * const job = bigquery.job('job-id');
     *
     * job.exists(function(err, exists) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * job.exists().then(function(data) {
     *   var exists = data[0];
     * });
     */
    exists: true,

    /**
     * Get a job if it exists.
     *
     * @method Job#get
     * @param {function} [callback] The callback function.
     * @param {?error} callback.err An error returned while making this
     *     request.
     * @param {Job} callback.job The job.
     * @returns {Promise}
     *
     * @example
     * const BigQuery = require('@google-cloud/bigquery');
     * const bigquery = new BigQuery();
     *
     * const job = bigquery.job('job-id');
     *
     * job.get(function(err, job, apiResponse) {
     *   if (!err) {
     *     // `job.metadata` has been populated.
     *   }
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * job.get().then(function(data) {
     *   var job = data[0];
     *   var apiResponse = data[1];
     * });
     */
    get: true,

    /**
     * Get the metadata of the job. This will mostly be useful for checking the
     * status of a previously-run job.
     *
     * @see [Jobs: get API Documentation]{@link https://cloud.google.com/bigquery/docs/reference/v2/jobs/get}
     *
     * @param {function} [callback] The callback function.
     * @param {?error} callback.err An error returned while making this
     *     request.
     * @param {object} callback.metadata The metadata of the job.
     * @param {object} callback.apiResponse The full API response.
     * @returns {Promise}
     *
     * @example
     * const BigQuery = require('@google-cloud/bigquery');
     * const bigquery = new BigQuery();
     *
     * const job = bigquery.job('id');
     * job.getMetadata(function(err, metadata, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * job.getMetadata().then(function(data) {
     *   const metadata = data[0];
     *   const apiResponse = data[1];
     * });
     */
    getMetadata: {
      reqOpts: {
        qs: {location: this.location},
      },
    },

    /**
     * Set the metadata for this job. This can be useful for updating job
     * labels.
     *
     * @see [Jobs: patch API Documentation]{@link https://cloud.google.com/bigquery/docs/reference/v2/jobs/patch}
     *
     * @method Job#setMetadata
     * @param {object} metadata Metadata to save on the Job.
     * @param {function} [callback] The callback function.
     * @param {?error} callback.err An error returned while making this
     *     request.
     * @param {object} callback.apiResponse The full API response.
     * @returns {Promise}
     *
     * @example
     * const BigQuery = require('@google-cloud/bigquery');
     * const bigquery = new BigQuery();
     *
     * const metadata = {
     *   configuration: {
     *     labels: {
     *       foo: 'bar'
     *     }
     *   }
     * };
     *
     * const job = bigquery.job('job-id');
     *
     * job.setMetadata(metadata, function(err, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * job.setMetadata(metadata).then(function(data) {
     *   const apiResponse = data[0];
     * });
     */
    setMetadata: true,
  };

  common.Operation.call(this, {
    parent: bigQuery,
    baseUrl: '/jobs',
    id: id,
    methods: methods,
  });

  this.bigQuery = bigQuery;
}

util.inherits(Job, common.Operation);

/**
 * Cancel a job. Use {@link Job#getMetadata} to see if the cancel
 * completes successfully. See an example implementation below.
 *
 * @see [Jobs: get API Documentation]{@link https://cloud.google.com/bigquery/docs/reference/v2/jobs/cancel}
 *
 * @param {function} [callback] The callback function.
 * @param {?error} callback.err An error returned while making this request.
 * @param {object} callback.apiResponse The full API response.
 * @returns {Promise}
 *
 * @example
 * const BigQuery = require('@google-cloud/bigquery');
 * const bigquery = new BigQuery();
 *
 * const job = bigquery.job('job-id');
 *
 * job.cancel(function(err, apiResponse) {
 *   // Check to see if the job completes successfully.
 *   job.on('error', function(err) {});
 *   job.on('complete', function(metadata) {});
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * job.cancel().then(function(data) {
 *   var apiResponse = data[0];
 * });
 */
Job.prototype.cancel = function(callback) {
  var qs;

  if (this.location) {
    qs = {location: this.location};
  }

  this.request(
    {
      method: 'POST',
      uri: '/cancel',
      qs,
    },
    callback
  );
};

/**
 * @callback QueryResultsCallback
 * @param {?Error} err An error returned while making this request.
 * @param {array} rows The results of the job.
 */
/**
 * @callback ManualQueryResultsCallback
 * @param {?Error} err An error returned while making this request.
 * @param {array} rows The results of the job.
 * @param {?object} nextQuery A pre-made configuration object for your next
 *     request. This will be `null` if no additional results are available.
 *     If the query is not yet complete, you may get empty `rows` and
 *     non-`null` `nextQuery` that you should use for your next request.
 * @param {object} apiResponse The full API response.
 */
/**
 * Get the results of a job.
 *
 * @see [Jobs: getQueryResults API Documentation]{@link https://cloud.google.com/bigquery/docs/reference/v2/jobs/getQueryResults}
 *
 * @param {object} [options] Configuration object.
 * @param {boolean} [options.autoPaginate=true] Have pagination handled
 *     automatically.
 * @param {number} [options.maxApiCalls] Maximum number of API calls to make.
 * @param {number} [options.maxResults] Maximum number of results to read.
 * @param {string} [options.pageToken] Page token, returned by a previous call,
 *     to request the next page of results. Note: This is automatically added to
 *     the `nextQuery` argument of your callback.
 * @param {number} [options.startIndex] Zero-based index of the starting row.
 * @param {number} [options.timeoutMs] How long to wait for the query to
 *     complete, in milliseconds, before returning. Default is to return
 *     immediately. If the timeout passes before the job completes, the request
 *     will fail with a `TIMEOUT` error.
 * @param {QueryResultsCallback|ManualQueryResultsCallback} [callback] The
 *     callback function. If `autoPaginate` is set to false a
 *     {@link ManualQueryResultsCallback} should be used.
 * @returns {Promise}
 *
 * @example
 * const BigQuery = require('@google-cloud/bigquery');
 * const bigquery = new BigQuery();
 *
 * const job = bigquery.job('job-id');
 *
 * //-
 * // Get all of the results of a query.
 * //-
 * job.getQueryResults(function(err, rows) {
 *   if (!err) {
 *     // rows is an array of results.
 *   }
 * });
 *
 * //-
 * // Customize the results you want to fetch.
 * //-
 * job.getQueryResults({
 *   maxResults: 100
 * }, function(err, rows) {});
 *
 * //-
 * // To control how many API requests are made and page through the results
 * // manually, set `autoPaginate` to `false`.
 * //-
 * function manualPaginationCallback(err, rows, nextQuery, apiResponse) {
 *   if (nextQuery) {
 *     // More results exist.
 *     job.getQueryResults(nextQuery, manualPaginationCallback);
 *   }
 * }
 *
 * job.getQueryResults({
 *   autoPaginate: false
 * }, manualPaginationCallback);
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * job.getQueryResults().then(function(data) {
 *   var rows = data[0];
 * });
 */
Job.prototype.getQueryResults = function(options, callback) {
  var self = this;

  if (is.fn(options)) {
    callback = options;
    options = {};
  }

  options = extend(
    {
      location: this.location,
    },
    options
  );

  this.bigQuery.request(
    {
      uri: '/queries/' + this.id,
      qs: options,
    },
    function(err, resp) {
      if (err) {
        callback(err, null, null, resp);
        return;
      }

      var rows = [];

      if (resp.schema && resp.rows) {
        rows = self.bigQuery.mergeSchemaWithRows_(resp.schema, resp.rows);
      }

      var nextQuery = null;
      if (resp.jobComplete === false) {
        // Query is still running.
        nextQuery = extend({}, options);
      } else if (resp.pageToken) {
        // More results exist.
        nextQuery = extend({}, options, {
          pageToken: resp.pageToken,
        });
      }

      callback(null, rows, nextQuery, resp);
    }
  );
};

/**
 * Get the results of a job as a readable object stream.
 *
 * @param {object} options Configuration object. See
 *     {@link Job#getQueryResults} for a complete list of options.
 * @return {stream}
 *
 * @example
 * const through2 = require('through2');
 * const fs = require('fs');
 * const BigQuery = require('@google-cloud/bigquery');
 * const bigquery = new BigQuery();
 *
 * const job = bigquery.job('job-id');
 *
 * job.getQueryResultsStream()
 *   .pipe(through2.obj(function (row, enc, next) {
 *     this.push(JSON.stringify(row) + '\n');
 *     next();
 *   }))
 *   .pipe(fs.createWriteStream('./test/testdata/testfile.json'));
 */
Job.prototype.getQueryResultsStream = common.paginator.streamify(
  'getQueryResultsAsStream_'
);

/**
 * This method will be called by `getQueryResultsStream()`. It is required to
 * properly set the `autoPaginate` option value.
 *
 * @private
 */
Job.prototype.getQueryResultsAsStream_ = function(options, callback) {
  options = extend({autoPaginate: false}, options);
  this.getQueryResults(options, callback);
};

/**
 * Poll for a status update. Execute the callback:
 *
 *   - callback(err): Job failed
 *   - callback(): Job incomplete
 *   - callback(null, metadata): Job complete
 *
 * @private
 *
 * @param {function} callback
 */
Job.prototype.poll_ = function(callback) {
  this.getMetadata(function(err, metadata, apiResponse) {
    if (!err && apiResponse.status && apiResponse.status.errors) {
      err = new common.util.ApiError(apiResponse.status);
    }

    if (err) {
      callback(err);
      return;
    }

    if (metadata.status.state !== 'DONE') {
      callback();
      return;
    }

    callback(null, metadata);
  });
};

/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
common.paginator.extend(Job, ['getQueryResults']);

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Job);

/**
 * Reference to the {@link Job} class.
 * @name module:@google-cloud/bigquery.Job
 * @see Job
 */
module.exports = Job;
