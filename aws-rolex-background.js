function getForm() {
  return document.querySelector("form#saml_form");
}

function getRoleARNFromRoleObj(roleObj) {
  return roleObj.querySelector("input").getAttribute("value");
}

function radioButtonEnterEvent(ev) {
  let form = document.querySelector("form#saml_form");
  if (ev.keyCode === 13) {
    form.submit();
  }
}

// fieldSet is the div.saml-account wrapper that contains everything
function hideSectionsWithNoMatchingRoles(fieldSet) {
  let allAccounts = fieldSet.querySelectorAll("div.saml-account");
  // We need to exclude the ones that have an ID, as they're the wrapper divs
  // we want to retain
  let topLevelAccounts = [];
  allAccounts.forEach(function (e) {
    if (e.id == "") {
      topLevelAccounts.push(e);
    }
  });

  // And for each of the top level accounts...
  topLevelAccounts.forEach(function (acc) {
    if (acc.querySelectorAll(".filter-match").length > 0) {
      acc.classList.add("acc-match");
      acc.classList.remove("acc-nomatch");
    } else {
      acc.classList.add("acc-nomatch");
      acc.classList.remove("acc-match");
    }
  })
}

window.onload = function () {
  // Find the form
  let form = getForm();
  // Find the fieldset in the form
  let fieldSet = form.querySelector("fieldset:first-of-type");

  // Create an input field
  let inputField = document.createElement("input");
  inputField.id = "custom-filter";
  inputField.onkeyup = function (ev) {
    let matchString = this.value;

    let logGroup = "Match for " + matchString;
    // console.group(logGroup)

    // Iterate through the roles, and add the 'nomatch' class to any that don't
    // match.
    // Only accept matches above this weight.
    let formObjs = form.querySelectorAll("div.saml-role");
    let roleARNs = [];

    // If we're not matching against anything, ensure that the filter classes
    // are removed
    if (matchString == "") {
      formObjs.forEach(function (roleObj) {
        roleObj.classList.remove("filter-nomatch");
        roleObj.classList.remove("filter-match");
      });
      // Also clear it from the account filter
      form.querySelectorAll(".saml-account").forEach(function (acc) {
        acc.classList.remove("acc-match");
        acc.classList.remove("acc-nomatch");
      })
      return
    }

    formObjs.forEach(function (roleObj) {
      let roleARN = getRoleARNFromRoleObj(roleObj);
      let roleNameMatch = roleARN.match(/\/(.*)/);
      let accountMatch = roleARN.match(/[0-9]+/);
      roleARNs.push({
        'roleARN': roleARN,
        'roleName': roleNameMatch.slice(-1)[0],
        'account': accountMatch.slice(-1)[0]
      })
    });
    let fuse = new Fuse(roleARNs, {
      keys: [
        { name: 'roleName', weight: 0.9 },
        { name: 'account', weight: 0.1 }
      ],
      includeScore: true,
      shouldSort: true,
      distance: 100,
      threshold: 0.2
    })
    let matches = fuse.search(matchString);
    // console.log(matches);
    let matchArray = matches.map(m => m.item.roleARN);
    formObjs.forEach(function (roleObj) {
      let roleARN = getRoleARNFromRoleObj(roleObj);
      if (matchArray.includes(roleARN)) {
        roleObj.classList.add("filter-match");
        roleObj.classList.remove("filter-nomatch");
      } else {
        roleObj.classList.add("filter-nomatch");
        roleObj.classList.remove("filter-match");
      }
    });

    // Mark the first match as selected.
    // Obligatory StackOverflow implementation
    // https://stackoverflow.com/a/2641374
    let BreakException = {};
    try {
      formObjs.forEach(function (roleObj) {
        let roleARN = getRoleARNFromRoleObj(roleObj);
        if (roleARN == matchArray[0]) {
          roleObj.querySelector("input").checked = true;
          throw BreakException;
        }
      });
    } catch (e) {
      if (e !== BreakException) throw e;
    }

    // Hide saml account sections with no matching roles
    hideSectionsWithNoMatchingRoles(fieldSet);

    // console.groupEnd(logGroup)
  }

  // Append it just before the fieldSet.
  form.insertBefore(inputField, fieldSet);

  this.setTimeout(function () {
    inputField.focus();
  }, 250);

  // Attach an event listener so if we press 'enter' on a radio button,
  // submit the form
  form.querySelectorAll("input[type=radio]").forEach(function (e) {
    e.addEventListener("keypress", radioButtonEnterEvent)
  })

  // Attach another event listener to the down arrow key to select the first
  // visible radio button
  inputField.addEventListener("keyup", function (ev) {
    if (ev.keyCode == 40) {
      let radioButton = form.querySelector("div.saml-role.filter-match input");
      radioButton.checked = true;
      radioButton.focus();
    }
  });
};
