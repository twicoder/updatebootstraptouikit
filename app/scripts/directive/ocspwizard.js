"use strict";

angular.module('ocspcomponents', [])
    .directive('optionText', function ($filter) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                prestepname: '@',
                nextstepname: '@',
                laststepname: '@',
                submitMethod: '&',
                resetMethod: '&'
            },
            controller:function($scope){
                $scope.validateForm = function(){
                    let flag = true;
                    angular.element('.steps .current').find("span.redtip:not(#idWarningMessageOfTokenField)").remove();
                    angular.element('.steps .current').find("#idWarningMessageOfTokenField").each(function(){
                      if($(this)[0].innerText!==""){
                        flag = false;
                      }
                    });
                    angular.element('.steps .current').find("input.ng-invalid:not(.tokenfield)").each(function(){
                      $(this).addClass("ng-touched");
                      $(this).after(`
                        <span class="redtip">${$filter('translate')('ocsp_web_common_035')}</span>
                      `);
                      flag = false;
                    });
                    angular.element('.steps .current').find("div.ng-invalid").each(function(){
                      $(this).addClass("ng-touched");
                      $(this).after(`
                        <span class="redtip">${$filter('translate')('ocsp_web_common_035')}</span>
                      `);
                      flag = false;
                    });
                    return flag;
                };
            },
            template:
            `
            <div>
                <a wz-next="validateForm()" style="{{ nextstyle }}" class="wizardnextstep oc-button">{{nextstepname}}</a>
                <a wz-next="submitMethod()" style="{{ laststyle }}" class="wizardnextstep oc-button">{{laststepname}}</a>
                <a wz-previous style="{{ prestepstyle }}" class="wizardprevstep oc-button">{{prestepname}}</a>
            </div>
            `,
            link: function ($scope, $element, $attrs) {
                $scope.nextstyle = "";
                $scope.laststyle = "display:none";
                $scope.prestepstyle = "display:none";
                $attrs.$observe('islast', function (value) {
                    if (value === 'true') {
                        $scope.nextstyle = "display:none";
                        $scope.laststyle = "";
                    } else {
                        $scope.nextstyle = "";
                        $scope.laststyle = "display:none";
                    }
                });
                $attrs.$observe('isfirst', function (value) {
                    if (value === 'true') {
                        $scope.prestepstyle = "display:none";
                    } else {
                        $scope.prestepstyle = "";
                    }
                });
            }

        };
    });

angular.module('ocspcomponents')
    .directive('wzStep', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                wzTitle: '@',
                wzHeadingTitle: '@',
            },
            require: '^ocspwizard',
            template:
            `
            <div style="margin:35px 35px 35px 35px;padding:0px 15px 0px 0px;" ng-show="selected" ng-class="{current: selected, done: completed}" class="step pre-scrollable" ng-transclude>
            </div>
            `,
            link: function ($scope, $element, $attrs, wizard) {
                $attrs.$observe('wzTitle', function () {
                    $scope.title = $scope.wzTitle;
                });
                $scope.title = $scope.wzTitle;
                wizard.addStep($scope);
                $scope.$on('$destroy', function () {
                    wizard.removeStep($scope);
                });
            }
        };
    });

angular.module('ocspcomponents')
    .directive('ocspwizard', function ($filter) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                onCancel: '&',
                onFinish: '&',
                submitMethod: '&',
                show: '=',
                name: '@',
                ngDisabled:'='
            },
            link: function (scope, element, attrs) {
                scope.windowStyle = {};

                scope.prestepname = $filter('translate')('ocsp_web_common_008');
                scope.nextstepname = $filter('translate')('ocsp_web_common_007');
                scope.submitname = $filter('translate')('ocsp_web_common_021');

                if (attrs.width) {
                    scope.windowStyle.width = attrs.width;
                }
                if (attrs.height) {
                    scope.windowStyle.height = attrs.height;
                }

                scope.hideModal = function () {
                    angular.element('.wizard-dialogue-mask').hide();
                    angular.element('.wizard-dialogue-container').removeClass("animation-dialogue-in");
                    angular.element('body,html').removeClass('forbid-scroll');
                };
                scope.showModal = function () {
                    angular.element('.wizard-dialogue-mask').show();
                    angular.element('.wizard-dialogue-container').addClass("animation-dialogue-in");
                    angular.element('body,html').addClass('forbid-scroll');
                };
            },
            template:
            `
            <div>
                <ul class="steps-indicator steps-{{getEnabledSteps().length}}">
                    <li ng-class="{default: !step.completed && !step.selected, current: step.selected && !step.completed, done: step.completed && !step.selected, editing: step.selected && step.completed}" ng-repeat="step in getEnabledSteps()">
                        <!--<a></a>-->
                        <span ng-if="currentStepNumber()<=$index">
                                            <div style="display:block;background-color:#FFF;height:56px;line-height:47px;text-align:center;border: 5px solid #eee;border-radius:50%">{{$index+1}}</div>
                                        </span>
                        <span ng-if="currentStepNumber()>$index">
                                            <div style="display:block;background-color:#f39c12;height:56px;line-height:47px;text-align:center;border: 5px solid #f39c12;border-radius:50%;font-size:30px;color:#FFFFFF"><div class="glyphicon glyphicon-ok"></div></div>
                                        </span>
                        <div style="margin-top: 25px;">{{step.title || step.wzTitle}}</div>
                    </li>
                </ul>
                <div class="steps" ng-transclude></div>
                <div class="myline">
                    <option-text submit-method="submitMethod()" reset-method="resetData()" isfirst="{{currentStepNumber() == 1}}" islast="{{selectedStep === steps[steps.length -1 ]}}" prestepname="{{prestepname}}" nextstepname="{{nextstepname}}" laststepname="{{submitname}}">!</option-text>
                </div>
            </div>
            `,

            //controller for wizard directive, treat this just like an angular controller
            controller: ['$scope', '$element', 'WizardHandler', '$q', '$timeout', function ($scope, $element, WizardHandler, $q, $timeout) {
                //this variable allows directive to load without having to pass any step validation
                var firstRun = true;
                //creating instance of wizard, passing this as second argument allows access to functions attached to this via Service
                WizardHandler.addWizard($scope.name || WizardHandler.defaultName, this);

                $scope.$on('$destroy', function () {
                    WizardHandler.removeWizard($scope.name || WizardHandler.defaultName);
                });

                var stepByTitle = function (titleToFind) {
                    var foundStep = null;
                    angular.forEach($scope.getEnabledSteps(), function (step) {
                        if (step.wzTitle === titleToFind) {
                            foundStep = step;
                        }
                    });
                    return foundStep;
                };

                $scope.resetData = function(){
                    if ($scope.onFinish) {
                        $scope.onFinish();
                    }
                    angular.forEach($scope.getEnabledSteps(), function (step) {
                        step.completed = false;
                    });
                    //go to first step
                    $timeout(function () {
                        var step = 0;
                        var enabledSteps = $scope.getEnabledSteps();
                        var stepTo;
                        //checking that step is a Number
                        if (angular.isNumber(step)) {
                            stepTo = enabledSteps[step];
                        } else {
                            //finding the step associated with the title entered as goTo argument
                            stepTo = stepByTitle(step);
                        }
                        //going to step
                        $scope.goTo(stepTo);
                    });

                    $scope.hideModal();
                };

                //unSelect All Steps
                function unselectAll() {
                    //traverse steps array and set each "selected" property to false
                    angular.forEach($scope.getEnabledSteps(), function (step) {
                        step.selected = false;
                    });
                    //set selectedStep variable to null
                    $scope.selectedStep = null;
                }

                //steps array where all the scopes of each step are added
                $scope.steps = [];

                var stepIdx = function (step) {
                    var idx = 0;
                    var res = -1;
                    angular.forEach($scope.getEnabledSteps(), function (currStep) {
                        if (currStep === step) {
                            res = idx;
                        }
                        idx++;
                    });
                    return res;
                };


                //access to context object for step validation
                $scope.context = {};

                //called each time step directive is loaded
                this.addStep = function (step) {
                    var wzOrder = (step.wzOrder >= 0 && !$scope.steps[step.wzOrder]) ? step.wzOrder : $scope.steps.length;
                    //adding the scope of directive onto step array
                    $scope.steps[wzOrder] = step;
                    //if this step is the new first then goTo it
                    if ($scope.getEnabledSteps()[0] === step) {
                        //goTo first step
                        $scope.goTo($scope.getEnabledSteps()[0]);
                    }
                };

                //called each time step directive is destroyed
                this.removeStep = function (step) {
                    var index = $scope.steps.indexOf(step);
                    if (index > 0) {
                        $scope.steps.splice(index, 1);
                    }
                };

                this.context = $scope.context;

                $scope.getStepNumber = function (step) {
                    return stepIdx(step) + 1;
                };

                $scope.goTo = function (step) {
                    //if this is the first time the wizard is loading it bi-passes step validation
                    if (firstRun) {
                        //deselect all steps so you can set fresh below
                        unselectAll();
                        $scope.selectedStep = step;
                        //making sure current step is not undefined
                        if (!angular.isUndefined($scope.currentStep)) {
                            $scope.currentStep = step.wzTitle;
                        }
                        //setting selected step to argument passed into goTo()
                        step.selected = true;
                        //emit event upwards with data on goTo() invoktion
                        // $scope.$emit('wizard:stepChanged', {step: step, index: stepIdx(step)});
                        //setting variable to false so all other step changes must pass validation
                        firstRun = false;
                    } else {
                        //createing variables to capture current state that goTo() was invoked from and allow booleans
                        var thisStep;
                        //getting data for step you are transitioning out of
                        if ($scope.currentStepNumber() > 0) {
                            thisStep = $scope.currentStepNumber() - 1;
                        } else if ($scope.currentStepNumber() === 0) {
                            thisStep = 0;
                        }
                        unselectAll();
                        $scope.selectedStep = step;
                        //making sure current step is not undefined
                        if (!angular.isUndefined($scope.currentStep)) {
                            $scope.currentStep = step.wzTitle;
                        }
                        //setting selected step to argument passed into goTo()
                        step.selected = true;
                        //emit event upwards with data on goTo() invoktion
                        // $scope.$emit('wizard:stepChanged', {step: step, index: stepIdx(step)});
                    }
                };

                $scope.currentStepNumber = function () {
                    //retreive current step number
                    return stepIdx($scope.selectedStep) + 1;
                };

                $scope.getEnabledSteps = function () {
                    return $scope.steps.filter(function (step) {
                        return step && step.disabled !== 'true';
                    });
                };

                //ALL METHODS ATTACHED TO this ARE ACCESSIBLE VIA WizardHandler.wizard().methodName()

                this.currentStepTitle = function () {
                    return $scope.selectedStep.wzTitle;
                };

                this.currentStepDescription = function () {
                    return $scope.selectedStep.description;
                };

                this.currentStep = function () {
                    return $scope.selectedStep;
                };

                this.totalStepCount = function () {
                    return $scope.getEnabledSteps().length;
                };

                //Access to enabled steps from outside
                this.getEnabledSteps = function () {
                    return $scope.getEnabledSteps();
                };

                //Access to current step number from outside
                this.currentStepNumber = function () {
                    return $scope.currentStepNumber();
                };
                //method used for next button within step
                this.next = function (callback) {

                    var enabledSteps = $scope.getEnabledSteps();
                    //setting variable equal to step  you were on when next() was invoked
                    var index = stepIdx($scope.selectedStep);
                    //checking to see if callback is a function
                    if (angular.isFunction(callback)) {
                        if (callback()) {
                            if (index === enabledSteps.length - 1) {
                                this.finish();
                            } else {
                                //invoking goTo() with step number next in line
                                $scope.goTo(enabledSteps[index + 1]);
                            }
                        } else {
                            return;
                        }
                    }
                    if (!callback) {
                        //completed property set on scope which is used to add class/remove class from progress bar
                        $scope.selectedStep.completed = true;
                    }
                    //checking to see if this is the last step.  If it is next behaves the same as finish()
                    if (index === enabledSteps.length - 1) {
                        this.finish();
                    } else {
                        //invoking goTo() with step number next in line
                        $scope.goTo(enabledSteps[index + 1]);
                    }

                };

                //used to traverse to any step, step number placed as argument
                this.goTo = function (step) {
                    //wrapped inside $timeout so newly enabled steps are included.
                    $timeout(function () {
                        var enabledSteps = $scope.getEnabledSteps();
                        var stepTo;
                        //checking that step is a Number
                        if (angular.isNumber(step)) {
                            stepTo = enabledSteps[step];
                        } else {
                            //finding the step associated with the title entered as goTo argument
                            stepTo = stepByTitle(step);
                        }
                        //going to step
                        $scope.goTo(stepTo);
                    });
                };

                //calls finish() which calls onFinish() which is declared on an attribute and linked to controller via wizard directive.
                this.finish = function () {
                    // if ($scope.onFinish) {
                    //     $scope.onFinish();
                    // }
                    // this.reset();
                    // $scope.hideModal();
                };

                this.previous = function () {
                    //getting index of current step
                    var index = stepIdx($scope.selectedStep);
                    //ensuring you aren't trying to go back from the first step
                    if (index === 0) {
                        // throw new Error("Can't go back. It's already in step 0");
                    } else {
                        //go back one step from current step
                        $scope.goTo($scope.getEnabledSteps()[index - 1]);
                    }
                };

                //cancel is alias for previous.
                this.cancel = function () {
                    if ($scope.onCancel) {
                        //onCancel is linked to controller via wizard directive:
                        $scope.onCancel();
                    } else {
                        //getting index of current step
                        var index = stepIdx($scope.selectedStep);
                        //ensuring you aren't trying to go back from the first step
                        if (index === 0) {
                            // throw new Error("Can't go back. It's already in step 0");
                        } else {
                            //go back one step from current step
                            $scope.goTo($scope.getEnabledSteps()[0]);
                        }
                    }
                };

                //reset
                this.reset = function () {
                    //traverse steps array and set each "completed" property to false
                    angular.forEach($scope.getEnabledSteps(), function (step) {
                        step.completed = false;
                    });
                    //go to first step
                    this.goTo(0);
                };

            }]
        };
    });

function wizardButtonDirective(action) {
    angular.module('ocspcomponents')
        .directive(action, function () {
            return {
                restrict: 'A',
                replace: false,
                require: '^ocspwizard',
                link: function ($scope, $element, $attrs, wizard) {

                    $element.on("click", function (e) {
                        e.preventDefault();
                        $scope.$apply(function () {
                            var isFormValid = $scope.$eval($attrs[action]);
                            if((action === 'wzNext' || action === 'wzFinish' ) && isFormValid){
                                wizard[action.replace("wz", "").toLowerCase()]();
                            } else if (action === 'wzPrevious'){
                                wizard[action.replace("wz", "").toLowerCase()]();
                            }
                        });
                    });
                }
            };
        });
}

wizardButtonDirective('wzNext');
wizardButtonDirective('wzPrevious');
wizardButtonDirective('wzFinish');
wizardButtonDirective('wzCancel');
wizardButtonDirective('wzReset');

angular.module('ocspcomponents').factory('WizardHandler', function () {
    var service = {};

    var wizards = {};

    service.defaultName = "defaultWizard";

    service.addWizard = function (name, wizard) {
        wizards[name] = wizard;
    };

    service.removeWizard = function (name) {
        delete wizards[name];
    };

    service.wizard = function (name) {
        var nameToUse = name;
        if (!name) {
            nameToUse = service.defaultName;
        }

        return wizards[nameToUse];
    };

    return service;
});
