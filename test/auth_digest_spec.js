var needle  = require('../'),
    auth = require('../lib/auth'),
    sinon   = require('sinon'),
    should  = require('should'),
    http    = require('http'),
    helpers = require('./helpers');

var createHash = require('crypto').createHash;

function md5(string) {
  return createHash('md5').update(string).digest('hex');
}

function parse_header(header) {
  var challenge = {},
      matches   = header.match(/([a-z0-9_-]+)="?([a-z0-9=\/\.@\s-\+]+)"?/gi);

  for (var i = 0, l = matches.length; i < l; i++) {
    var parts = matches[i].split('='),
        key   = parts.shift(),
        val   = parts.join('=').replace(/^"/, '').replace(/"$/, '');

    challenge[key] = val;
  }

  return challenge;
}

describe('auth_digest', function() {
  describe('With qop (RFC 2617)', function() {
    it('should generate a proper header', function() {
      // from https://tools.ietf.org/html/rfc2617
      var performDigest = function() {
        var header = 'Digest realm="testrealm@host.com", qop="auth,auth-int", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"';
        var user = 'Mufasa';
        var pass = 'Circle Of Life';
        var method = 'get';
        var path = '/dir/index.html';

        var updatedHeader = auth.digest(header, user, pass, method, path);
        var parsedUpdatedHeader = parse_header(updatedHeader);

        var ha1 = md5(user + ':' + parsedUpdatedHeader.realm + ':' + pass);
        var ha2 = md5(method.toUpperCase() + ':' + path);
        var expectedResponse = md5([
          ha1,
          parsedUpdatedHeader.nonce,
          parsedUpdatedHeader.nc,
          parsedUpdatedHeader.cnonce,
          parsedUpdatedHeader.qop,
          ha2
        ].join(':'));

        return {
          header: updatedHeader,
          parsed: parsedUpdatedHeader,
          expectedResponse: expectedResponse,
        }
      }

      const result = performDigest();

      (result.header).should
        .match(/qop="auth"/)
        .match(/uri="\/dir\/index.html"/)
        .match(/opaque="5ccc069c403ebaf9f0171e9517f40e41"/)
        .match(/realm="testrealm@host\.com"/)
        .match(/response=/)
        .match(/nc=/)
        .match(/nonce=/)
        .match(/cnonce=/);

      (result.parsed.response).should.be.eql(result.expectedResponse);
    });
  });

  describe('With a special character in the nonce', function() {
    it('should generate a proper header', function() {
      // from https://tools.ietf.org/html/rfc2617
      var performDigest = function() {
        var header = 'Digest realm="testrealm@host.com", qop="auth,auth-int", nonce="dcd98b7102dd2f0e8b11d0f60+0bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"';
        var user = 'Mufasa';
        var pass = 'Circle Of Life';
        var method = 'get';
        var path = '/dir/index.html';

        var updatedHeader = auth.digest(header, user, pass, method, path);
        var parsedUpdatedHeader = parse_header(updatedHeader);

        var ha1 = md5(user + ':' + parsedUpdatedHeader.realm + ':' + pass);
        var ha2 = md5(method.toUpperCase() + ':' + path);
        var expectedResponse = md5([
          ha1,
          parsedUpdatedHeader.nonce,
          parsedUpdatedHeader.nc,
          parsedUpdatedHeader.cnonce,
          parsedUpdatedHeader.qop,
          ha2
        ].join(':'));

        return {
          header: updatedHeader,
          parsed: parsedUpdatedHeader,
          expectedResponse: expectedResponse,
        }
      }

      const result = performDigest();

      (result.header).should
        .match(/qop="auth"/)
        .match(/uri="\/dir\/index.html"/)
        .match(/opaque="5ccc069c403ebaf9f0171e9517f40e41"/)
        .match(/realm="testrealm@host\.com"/)
        .match(/response=/)
        .match(/nc=/)
        .match(/nonce=/)
        .match(/cnonce=/);

      (result.parsed.response).should.be.eql(result.expectedResponse);
    });
  });

  describe('Without qop (RFC 2617)', function() {
    it('should generate a proper header', function() {
      // from https://tools.ietf.org/html/rfc2069
      var performDigest = function() {
        var header = 'Digest realm="testrealm@host.com", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"';
        var user = 'Mufasa';
        var pass = 'Circle Of Life';
        var method = 'get';
        var path = '/dir/index.html';

        var updatedHeader = auth.digest(header, user, pass, method, path);
        var parsedUpdatedHeader = parse_header(updatedHeader);

        var ha1 = md5(user + ':' + parsedUpdatedHeader.realm + ':' + pass);
        var ha2 = md5(method.toUpperCase() + ':' + path);
        var expectedResponse = md5([ha1, parsedUpdatedHeader.nonce, ha2].join(':'));

        return {
          header: updatedHeader,
          parsed: parsedUpdatedHeader,
          expectedResponse: expectedResponse,
        }
      }

      const result = performDigest();

      (result.header).should
        .not.match(/qop=/)
        .match(/uri="\/dir\/index.html"/)
        .match(/opaque="5ccc069c403ebaf9f0171e9517f40e41"/)
        .match(/realm="testrealm@host\.com"/)
        .match(/response=/)
        .not.match(/nc=/)
        .match(/nonce=/)
        .not.match(/cnonce=/);

      (result.parsed.response).should.be.eql(result.expectedResponse);
    });
  });
})
