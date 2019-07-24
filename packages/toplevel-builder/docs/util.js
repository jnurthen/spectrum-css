const logger = require('gulplog');

const labelColors = {
  'Deprecated': 'red',

  'Beta Contribution': 'orange',

  'Contribution': 'yellow',
  'CSS Unverified': 'yellow',

  'Canon': 'green',
  'CSS Verified': 'green'
};

const dnaStatusTranslation = {
  'Released': 'Canon',
  'Beta': 'Contribution',
  'Precursor': 'Contribution'
};

const cssStatusTranslation = {
  'Beta': 'CSS Unverified',
  'Verified': 'CSS Verified'
};

exports.getLabelColor = function(status) {
  return labelColors[status] || 'grey';
};

exports.getDNAStatus = function(dnaComponentId, dnaStatus, cssStatus) {
  if (cssStatus === 'Deprecated') {
    dnaStatus = 'Deprecated';
  }

  if (cssStatus === 'CSS Verified') {
    if (dnaStatus !== 'Released') {
      logger.debug(`${dnaComponentId} is ${cssStatus} in CSS, but ${dnaStatus} in DNA`);
      dnaStatus = 'Canon';
    }
  }

  if (!dnaStatus) {
    logger.debug(`${dnaComponentId} has no DNA status`);
    dnaStatus = 'Beta Contribution';
  }

  return dnaStatusTranslation[dnaStatus] || dnaStatus;
};

exports.getCSSStatus = function(dnaComponentId, cssStatus) {
  if (cssStatus === 'Released' || !cssStatus) {
    cssStatus = 'Beta';
  }
  return cssStatusTranslation[cssStatus] || cssStatus;
};

exports.getSlug = function(name, subName) {
  if (subName) {
    name += `-${subName}`;
  }
  return name.toLowerCase().replace(/[^a-z\-]/g, '');
};

exports.populateDNAInfo = function(component, dnaVars) {
  // Get DNA information
  var dnaComponentId = component.id || component.name.toLowerCase();

  // Get info based on component variation first, then component name second
  var dnaComponentTitle = dnaVars['spectrum-' + dnaComponentId + '-name'];

  var dnaDescription = dnaVars['spectrum-' + dnaComponentId + '-description'];

  var cssStatus = this.getCSSStatus(dnaComponentId, component.status);
  var dnaStatus = this.getDNAStatus(dnaComponentId, dnaVars['spectrum-' + dnaComponentId + '-status'] || component.dnaStatus, cssStatus);

  // Store the info
  component.name = component.name || dnaComponentTitle;
  component.cssStatus = cssStatus;
  component.dnaStatus = dnaStatus;

  // Add other data
  component.id = dnaComponentId;
  component.slug = this.getSlug(component.name);

  // Assume it's canon if we're verified
  if (component.status === 'Verified') {
    component.dnaStatus = 'Canon';
  }

  if (component.examples) {
    for (id in component.examples) {
      let example = component.examples[id];
      if (typeof example === 'string') {
        // Handle markup only examples
        example = {
          id: id,
          markup: example
        };
        component.examples[id] = example;
      }
      else {
        example.id = example.id || id;
      }

      // All examples are verified if the outer component is verified
      if (component.status === 'Verified') {
        example.status = 'Verified';
      }

      // The example is canon if the component is Canon and Verified
      if (component.dnaStatus === 'Canon' && component.status === 'Verified') {
        example.dnaStatus = 'Canon';
      }

      this.populateDNAInfo(example, dnaVars);
    }
  }
};
