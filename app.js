function Validator(formSelector, options = {}) {
  var _this = this;
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  var formRules = {};
  // quy uoc tao rules
  // - neu co loi return error message
  // - neu ko co return undefine
  var validatorRules = {
    required: function (value) {
      return value ? undefined : "Please enter the field";
    },
    email: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : "Please enter the Email";
    },
    min: function (min) {
      return function (value) {
        return value.length >= min
          ? undefined
          : `Please enter at least ${min} characters`;
      };
    },
  };
  // lay ra element trong DOM
  var formElement = document.querySelector(formSelector);
  // xu li khi co element
  if (formElement) {
    var inputs = formElement.querySelectorAll("[name][rules]");

    for (var input of inputs) {
      var rules = input.getAttribute("rules").split("|");
      for (var rule of rules) {
        var isRuleHasValue = rule.includes(":");
        var ruleInfo;

        if (isRuleHasValue) {
          ruleInfo = rule.split(":");
          rule = ruleInfo[0];
        }

        var ruleFunc = validatorRules[rule];
        if (isRuleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[1]);
        }
        if (Array.isArray(formRules[input.name])) {
          formRules[input.name].push(ruleFunc);
        } else {
          formRules[input.name] = [ruleFunc];
        }
      }

      // lang nghe su kien validate (blur, change, ...)
      input.onblur = handleValidate;
      input.oninput = handleClear;
    }
    // ham thuc hien validate
    function handleValidate(e) {
      var rules = formRules[e.target.name];
      var errorMessage;
      for (var rule of rules) {
        errorMessage = rule(e.target.value);
        if (errorMessage) break;
      }

      // neu co loi thi render ra UI
      if (errorMessage) {
        var formGroup = getParent(e.target, ".form-group");
        if (formGroup) {
          formGroup.classList.add("invalid");
          var formMessage = formGroup.querySelector(".form-message");
          if (formMessage) {
            formMessage.innerText = errorMessage;
          }
        }
      }
      return !errorMessage;
    }
    //ham clear error message
    function handleClear(event) {
      var formGroup = getParent(event.target, ".form-group");
      if (formGroup.classList.contains("invalid")) {
        formGroup.classList.remove("invalid");
        var formMessage = formGroup.querySelector(".form-message");
        if (formMessage) {
          formMessage.innerText = "";
        }
      }
    }
  }
  // xu li hanh vi submit form
  formElement.onsubmit = function (e) {
    e.preventDefault();
    var inputs = formElement.querySelectorAll("[name][rules]");
    var isValid = true;
    for (var input of inputs) {
      if (!handleValidate({ target: input })) {
        isValid = false;
      }
    }

    if (isValid) {
      if (typeof _this.onSubmit === "function") {
        var enableInput = formElement.querySelectorAll("[name]");
        var formValues = Array.from(enableInput).reduce(function (
          values,
          input
        ) {
          switch (input.type) {
            case "radio":
              values[input.name] = formElement.querySelector(
                'input[name="' + input.name + '"]:checked'
              ).value;
              break;
            case "checkbox":
              if (input.matches(":checked")) {
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);
              } else if (!values[input.name]) {
                values[input.name] = "";
              }
              break;
            case "file":
              values[input.name] = input.files;
              break;
            default:
              values[input.name] = input.value;
          }
          return values;
        },
        {});
        //goi lai ham onSubmit va tra ve gia tri cua form
        _this.onSubmit(formValues);
      } else {
        formElement.submit();
      }
    }
  };
}
