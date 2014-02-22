# Lazyload.js #
[![Build Status](https://travis-ci.org/clickalicious/Lazyload.js.png?branch=master)](https://travis-ci.org/clickalicious/Lazyload.js)

<a href="http://ctt.ec/UAkNV" target="_blank">
  <img src="http://jpillora.com/github-twitter-button/img/tweet.png"></img>
</a>

... brand new, fresh and in shape!
If you're looking for more detailed information about Lazyload.js you
should look either here [github project page](http://clickalicious.github.com/Lazyload.js/) or here [github project wiki](http://clickalicious.github.com/Lazyload.js/).


## Latest changes

**0.0.5**

- Fixed a bug which led to a break when parsing "@properties" or
  "@configuration" from annotations.

- Added "basket.js - a simple script loader that caches scripts" (0.4.0)
  and "RSVP.js a tiny Promise implementation [required by basket.js]" (1.x)
  to the build.

- Upgraded grunt to 0.0.4 style (Config/Build directives).

- Fixed typos, coding standard violations and linted the whole source.

- Added tag 0.0.5 to git repo source.

**0.0.4**

- Added tag 0.0.4 to git repo source.

- Complete refactoring of the codebase. Optimized the code on speed and
  size. Reduced the complexity and increased the quality of the
  comments while also reducing the amount of comments made.

- Made loading of external/remote resources possible. Remote resources
  can be treated in the same way like local resources. The only
  exception is that external resources currently can't have any
  dependencies defined by @resources tag within file cause i have
  currently no access to the source of those resources. But i've found
  a way to load the source from external resources and get access to it
  too.

- Changed build-system to grunt. Added all required files
  (configuration) so you will also be able to build, document, test
  and compress Lazyload.js if you make customizations.

- Rewritten the whole test-suite. If grunt is used to run tests with
  Qunit the tests are executed locally without browser (Phantom.js)
  like "file://". So no XHR calls are possible and so i decided to make
  use of Qunit in combination with "FakeXMLHttpRequest" from Sinon.JS.

- Fixed comments in source to made the documentation with JSDoc(1|2|3)
  possible.

- Added complete documentation in JSDoc(3) format to folder
  [/__doc](https://github.com/clickalicious/Lazyload.js/blob/master/__doc/)
  have a look at the documentation and the source. Everythings so fine you
  will like to work with

- added this changelog to README.md


For more details view [CHANGELOG.md](https://github.com/clickalicious/Lazyload.js/blob/master/CHANGELOG.md)
