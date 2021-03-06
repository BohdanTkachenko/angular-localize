/* global describe, beforeEach, module, it, inject, expect */

(function () {
    'use strict';

    describe('localize module', function () {

        var i18nMock = {
            Apples: function () {
                return 'Äpfel';
            },
            'My hands are <strong>Bananas</strong>!': function () {
                return 'Meine Hände sind <strong>Bananen</strong>!';
            },
            unsafeHTML: function () {
                return '<p>XSS<script>console.log("XSS");</script> Test</p>';
            },
            textWithHTMLSpecialChars: function () {
                return '1 & 2 < 3 > 2 & 1';
            },
            'Hello {name}!': function (data) {
                return 'Hallo ' + data.name + '!';
            },
            'Hello <strong>{name}</strong>!': function (data) {
                return 'Hallo <strong>' + data.name + '</strong>!';
            },
            'Hello world': 'Hallo Welt'
        };

        beforeEach(function () {
            module('localize');

            module(function ($provide) {
                $provide.decorator('$window', function ($delegate) {
                    $delegate.i18n = i18nMock;
                    return $delegate;
                });
            });
        });

        describe('escapeHTML filter', function () {

            it('Should escape HTML special characters', inject(
                function ($filter) {
                    expect($filter('escapeHTML')('<>&"'))
                        .toBe('&lt;&gt;&amp;&quot;');
                }
            ));

            it('Should not escape other non-ASCII characters', inject(
                function ($filter) {
                    expect($filter('escapeHTML')('öäü'))
                        .toBe('öäü');
                }
            ));

        });

        describe('localizeConfig service', function () {

            it('Should return the $window.i18n object as property', inject(
                function (localizeConfig) {
                    expect(localizeConfig.i18n).toBe(i18nMock);
                }
            ));

        });

        describe('localize service', function () {

            it('Should return the i18n translation function result', inject(
                function (localize) {
                    expect(localize('Apples'))
                        .toBe('Äpfel');
                }
            ));

            it('Should return the key if there is no translation function', inject(
                function (localize) {
                    expect(localize('Bananas'))
                        .toBe('Bananas');
                }
            ));

            it('Should replace translation placeholders with data argument values', inject(
                function (localize) {
                    expect(localize('Hello {name}!', {name: 'Bob'}))
                        .toBe('Hallo Bob!');
                }
            ));

            it('Should use an empty object if the data argument is not provided', inject(
                function (localize) {
                    expect(localize('Hello {name}!'))
                        .toBe('Hallo undefined!');
                }
            ));

            it('Should escape user data when the escape argument is true', inject(
                function (localize) {
                    expect(localize('Hello {name}!', {name: '&<>'}, true))
                        .toBe('Hallo &amp;&lt;&gt;!');
                }
            ));

            it('Should return the i18n static translation', inject(
                function (localize) {
                    expect(localize('Hello world'))
                        .toBe('Hallo Welt');
                }
            ));

        });

        describe('localize filter', function () {

            it('Should return the localize service as filter', inject(
                function ($filter, localize) {
                    expect($filter('localize'))
                        .toBe(localize);
                }
            ));

            it('Should set the element text to the translation result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span>{{text | localize}}</span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.text()).toBe('');
                    $rootScope.text = 'Apples';
                    $rootScope.$digest();
                    expect(element.text()).toBe('Äpfel');
                }
            ));

            it('Should set the element text to the static translation result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span>{{text | localize}}</span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.text()).toBe('');
                    $rootScope.text = 'Hello world';
                    $rootScope.$digest();
                    expect(element.text()).toBe('Hallo Welt');
                }
            ));

            it('Should replace translation placeholders with object values', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span>{{text | localize:user}}</span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.text()).toBe('');
                    $rootScope.text = 'Hello {name}!';
                    $rootScope.$digest();
                    expect(element.text()).toBe('Hallo undefined!');
                    $rootScope.user = {name: 'Bob'};
                    $rootScope.$digest();
                    expect(element.text()).toBe('Hallo Bob!');
                }
            ));

            it('Should escape user data passed to the translation function', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span ng-bind-html="text | localize:user:true"></span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.html()).toBe('');
                    $rootScope.text = 'Hello <strong>{name}</strong>!';
                    $rootScope.$digest();
                    expect(element.html()).toBe('Hallo <strong>undefined</strong>!');
                    $rootScope.user = {name: '&<>'};
                    $rootScope.$digest();
                    expect(element.html()).toBe('Hallo <strong>&amp;&lt;&gt;</strong>!');
                }
            ));

        });

        describe('localize directive', function () {

            it('Should use the translation key as element text if the key is the result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize="Bananas"></span>'
                    )($rootScope);
                    expect(element.text()).toBe('Bananas');
                }
            ));

            it('Should skip localization if the element content is the key and result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize>Bananas</span>'
                    )($rootScope);
                    expect(element.text()).toBe('Bananas');
                }
            ));

            it('Should set the element text to the translation result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize="Apples"></span>'
                    )($rootScope);
                    expect(element.text()).toBe('Äpfel');
                }
            ));

            it('Should set the element text to the static translation result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize="Hello world"></span>'
                    )($rootScope);
                    expect(element.text()).toBe('Hallo Welt');
                }
            ));

            it('Should use the element content as key for the translation function', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize>Apples</span>'
                    )($rootScope);
                    expect(element.text()).toBe('Äpfel');
                }
            ));

            it('Should allow a safe subset of HTML for the translation result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize>My hands are <strong>Bananas</strong>!</span>'
                    )($rootScope);
                    expect(element.html()).toBe('Meine Hände sind <strong>Bananen</strong>!');
                }
            ));

            it('Should sanitize translation results and strip unsafe HTML', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize>unsafeHTML</span>'
                    )($rootScope);
                    expect(element.html()).toBe('<p>XSS Test</p>');
                }
            ));

            it('Should insert attribute localize values as text content', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize="textWithHTMLSpecialChars"></span>'
                    )($rootScope);
                    expect(element.html()).toBe('1 &amp; 2 &lt; 3 &gt; 2 &amp; 1');
                }
            ));

            it('Should replace translation placeholders with dataset values', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span data-name="{{user.name}}" localize="Hello {name}!"></span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.text()).toBe('Hallo !');
                    $rootScope.user = {name: 'Bob'};
                    $rootScope.$digest();
                    expect(element.text()).toBe('Hallo Bob!');
                }
            ));

            it('Should escape user data passed to the translation function', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<span data-name="{{user.name}}" localize>Hello <strong>{name}</strong>!</span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.html()).toBe('Hallo <strong></strong>!');
                    $rootScope.user = {name: '&<>'};
                    $rootScope.$digest();
                    expect(element.html()).toBe('Hallo <strong>&amp;&lt;&gt;</strong>!');
                }
            ));

            it('Should set the input placeholder text to the translation result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<input localize="Apples">'
                    )($rootScope);
                    expect(element.attr('placeholder')).toBe('Äpfel');
                }
            ));

            it('Should use the translation key as placeholder text if the key is the result', inject(
                function ($compile, $rootScope) {
                    var element = $compile(
                        '<input localize="Bananas">'
                    )($rootScope);
                    expect(element.attr('placeholder')).toBe('Bananas');
                }
            ));

        });

        describe('localize factory', function () {

            it('Should create attribute based localize directives', function () {
                module(function ($compileProvider) {
                    $compileProvider
                        .directive('localizeTitle', function (localizeFactory) {
                            return localizeFactory();
                        })
                        .directive('localizeSummary', function (localizeFactory) {
                            return localizeFactory();
                        })
                        .directive('localizeStatic', function (localizeFactory) {
                            return localizeFactory();
                        });
                });
                inject(function ($compile, $rootScope) {
                    var element1 = $compile(
                            '<span localize-title="Bananas"></span>'
                        )($rootScope),
                        element2 = $compile(
                            '<table localize-summary="Apples"></table>'
                        )($rootScope),
                        element3 = $compile(
                            '<table localize-static="Hello world"></table>'
                        )($rootScope);
                    expect(element1.attr('title')).toBe('Bananas');
                    expect(element2.attr('summary')).toBe('Äpfel');
                    expect(element3.attr('static')).toBe('Hallo Welt');
                });
            });

            it('Should create attribute based localize directives with multiple dashes', function () {
                module(function ($compileProvider) {
                    $compileProvider
                        .directive('localizeDataContent', function (localizeFactory) {
                            return localizeFactory();
                        });
                });
                inject(function ($compile, $rootScope) {
                    var element = $compile(
                        '<span localize-data-content="Apples"></span>'
                    )($rootScope);
                    expect(element.attr('data-content')).toBe('Äpfel');
                });
            });

            it('Should observe data-* attributes to update the translation result', function () {
                module(function ($compileProvider) {
                    $compileProvider
                        .directive('localizeTitle', function (localizeFactory) {
                            return localizeFactory();
                        });
                });
                inject(function ($compile, $rootScope) {
                    var element = $compile(
                        '<span data-name="{{user.name}}" localize-title="Hello {name}!"></span>'
                    )($rootScope);
                    $rootScope.$digest();
                    expect(element.attr('title')).toBe('Hallo !');
                    $rootScope.user = {name: 'Bob'};
                    $rootScope.$digest();
                    expect(element.attr('title')).toBe('Hallo Bob!');
                });
            });

        });

    });

}());
