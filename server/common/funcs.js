"use strict";

let _getRunningTimeFromTask = function (oneTask) {
  if(oneTask){
    let date = new Date();
    let sss = date.getTime();
    if (oneTask.dataValues !== undefined && oneTask.dataValues.start_time !== undefined &&
      oneTask.dataValues.start_time !== null && oneTask.dataValues.start_time !== "") {
      if (oneTask.status === 2 || oneTask.status === "RUNNING") {
        oneTask.dataValues.running_time = parseInt(sss - oneTask.dataValues.start_time);
      } else if ((oneTask.status === 0 || oneTask.status === "STOPPED") && oneTask.dataValues.stop_time !== undefined &&
        oneTask.dataValues.stop_time !== null &&
        oneTask.dataValues.stop_time !== "") {
          oneTask.dataValues.running_time = parseInt(oneTask.dataValues.stop_time - oneTask.dataValues.start_time);
      } else {
        oneTask.dataValues.running_time = 0;
      }
    }
  }
};

let _getRunningTime = function (tasks) {
  if (tasks !== undefined && tasks.length > 0) {
    tasks.forEach((item) =>{
      _getRunningTimeFromTask(item);
    });
  }
};

let _getRunningTimeStormJobFromOneJob = function (job) {
  if (job) {
    let date = new Date();
    let sss = date.getTime();
      if (job.dataValues !== undefined && job.dataValues.start_time !== undefined &&
        job.dataValues.start_time !== null && job.dataValues.start_time !== "") {
        if (job.status === "RUNNING") {
          job.dataValues.running_time = parseInt(sss - (new Date(job.dataValues.start_time)).getTime());
        } else if (job.status === "STOPPED" && job.dataValues.stop_time !== undefined &&
          job.dataValues.stop_time !== null &&
          job.dataValues.stop_time !== "") {
          job.dataValues.running_time = parseInt((new Date(job.dataValues.stop_time)).getTime() - (new Date(job.dataValues.start_time)).getTime());
        } else {
          job.dataValues.running_time = 0;
        }
      }

  }
};

let _getRunningTimeStormJob = function (jobs) {
  if (jobs !== undefined && jobs.length > 0) {
    jobs.forEach((item)=>{
      _getRunningTimeStormJobFromOneJob(item);
    });
  }
};

function isLeafProperty(targetProperty) {
  for (const key in targetProperty) {
      const value = targetProperty[key];
      if (typeof value !== 'boolean' && typeof value !== 'number' && typeof value !== 'string') {
          return false;
      }
  }
  return true;
}

function isRequiredProperty(targetProperty) {
  let isLeaf = isLeafProperty(targetProperty);
  let isRequired = false;
  if (isLeaf) {
      isRequired = targetProperty.required;
  } else {
      for (const key in targetProperty) {
          isRequired = isRequired || isRequiredProperty(targetProperty[key]);
      }
  }
  return isRequired;
}

function formatValidator(rawDataStructure, formatedDataStructure) {
  for (const key in rawDataStructure) {
      let formatedProperty = {};
      formatedProperty.name = key;
      formatedProperty.isleaf = isLeafProperty(rawDataStructure[key]);
      formatedProperty.isrequired = isRequiredProperty(rawDataStructure[key]);
      formatedProperty.subproperties = [];
      if (!formatedProperty.isleaf) {
          formatValidator(rawDataStructure[key], formatedProperty.subproperties);
      }
      formatedDataStructure.push(formatedProperty);

  }
}

function checkDataValidation(templateValidator, dataNeedCheck, report, currentDataLevel){
  let result = true;
  for(let index in templateValidator){
      if(templateValidator[index].isrequired){
          if(dataNeedCheck[templateValidator[index].name] === null || dataNeedCheck[templateValidator[index].name] === undefined ){
              result = result && false;
              let checkFailedLevelInfo = currentDataLevel + templateValidator[index].name;
              report.push(checkFailedLevelInfo);
          } else {
              if(!templateValidator[index].isleaf){
                  result = result && checkDataValidation(templateValidator[index].subproperties,
                      dataNeedCheck[templateValidator[index].name],
                      report,
                      currentDataLevel + templateValidator[index].name + ".");
              }
          }
      }
  }
  return result;
}


function dealDataInterfaceProperties(dataInterface, dsid, type) {
  dataInterface.dsid = dsid;
  dataInterface.type = type;
  dataInterface.status = 1;
  if (dataInterface.userFields === undefined || dataInterface.userFields === null) {
    dataInterface.userFields = [];
  }
  dataInterface.properties = { "props": [], "userFields": dataInterface.userFields, "fields": [] };
  if (dataInterface.delim !== undefined && dataInterface.delim === "|") {
    dataInterface.delim = "\\|";
  }
  if (dataInterface.delim === undefined) {
    dataInterface.delim = "";
  }
  let _parseFields = function (properties, fields, name) {
    if (fields === undefined) {
      return [];
    }
    fields = fields.replace(/\s/g, '');
    let splits = fields.split(",");
    for (let i in splits) {
      if (splits[i] !== undefined && splits[i] !== "") {
        properties[name].push({
          "pname": splits[i].trim(),
          "ptype": "String"
        });
      }
    }
    return splits;
  };
  if(dataInterface.fields){
    _parseFields(dataInterface.properties,dataInterface.fields,"fields");
  }
  if (dataInterface.topic !== undefined) {
    dataInterface.properties.props.push({
      "pname": "topic",
      "pvalue": dataInterface.topic
    });
  }
  if (dataInterface.uniqueKey !== undefined) {
    dataInterface.properties.props.push({
      "pname": "uniqKeys",
      "pvalue": dataInterface.uniqueKey
    });
  }
  if (dataInterface.groupid !== undefined) {
    dataInterface.properties.props.push({
      "pname": "group.id",
      "pvalue": dataInterface.groupid
    });
  }
  if (dataInterface.codisKeyPrefix !== undefined) {
    dataInterface.properties.props.push({
      "pname": "codisKeyPrefix",
      "pvalue": dataInterface.codisKeyPrefix
    });
  }

  // update pname/pvalue from customParamsKV,
  // if not exists in dataInterface.properties.props, then push into it
  if(dataInterface.customParamsKV){
    dataInterface.customParamsKV.forEach( (oneProperty) => {
      let pnameAlreadyExists = false;
      dataInterface.properties.props.forEach( (existingProperty) => {
        if(existingProperty.pname === oneProperty.pname){
          existingProperty.pvalue = oneProperty.pvalue;
          pnameAlreadyExists = true;
        }
      });
      if(!pnameAlreadyExists){
        dataInterface.properties.props.push(oneProperty);
      }
    });
  }

  if (dataInterface.inputs !== undefined && dataInterface.inputs.length > 0) {
    dataInterface.properties.sources = [];
    for (let i in dataInterface.inputs) {
      if (dataInterface.inputs[i].delim !== undefined && dataInterface.inputs[i].delim === "|") {
        dataInterface.inputs[i].delim = "\\|";
      }
      if (dataInterface.inputs[i].delim === undefined) {
        dataInterface.inputs[i].delim = "";
      }
      let result = {
        "pname": dataInterface.inputs[i].name,
        "delim": dataInterface.inputs[i].delim,
        "topic": dataInterface.inputs[i].topic,
        "userFields": [],
        "fields": []
      };
      _parseFields(result, dataInterface.inputs[i].fields, "fields");
      if (dataInterface.inputs[i].userFields !== undefined && dataInterface.inputs[i].userFields.length > 0) {
        for (let j in dataInterface.inputs[i].userFields) {
          result.userFields.push({
            "pname": dataInterface.inputs[i].userFields[j].name,
            "pvalue": dataInterface.inputs[i].userFields[j].value,
            "undefined": "on"
          });
        }
      }
      dataInterface.properties.sources.push(result);
    }
  }
  dataInterface.properties = JSON.stringify(dataInterface.properties);
}

function handleAdvancedProperties(event){
  event.PROPERTIES = JSON.parse(event.PROPERTIES);
    // update pname/pvalue from customParamsKV,
  // if not exists in events[i].PROPERTIES.props, then push into it
  if(event.customParamsKV){
    // 对于自定义高级属性，如果已经在properties中存在，则更新其值；
    // 如果不存在，则添加新纪录
    event.customParamsKV.forEach( (oneProperty) => {
      let pnameAlreadyExists = false;
      event.PROPERTIES.props.forEach( (existingProperty) => {
        if(existingProperty.pname === oneProperty.pname){
          existingProperty.pvalue = oneProperty.pvalue;
          pnameAlreadyExists = true;
        }
      });
      if(!pnameAlreadyExists){
        event.PROPERTIES.props.push(oneProperty);
      }
    });

    // 对于用户在界面中删除的属性，需要在合并后的props中删除掉
    if(event.customDeleteProps){
      event.customDeleteProps.forEach( (oneProperty) => {
        event.PROPERTIES.props.forEach( (existingProperty) => {
          if(existingProperty.pname === oneProperty.pname){
            event.PROPERTIES.props.splice(event.PROPERTIES.props.indexOf(existingProperty),1);
          }
        });
      });
    }
  }
  event.PROPERTIES = JSON.stringify(event.PROPERTIES);

}

function handleAdvancedPropertiesOfInput(input){
  input.PROPERTIES = JSON.parse(input.properties);
    // update pname/pvalue from customParamsKV,
  // if not exists in events[i].PROPERTIES.props, then push into it
  if(input.customParamsKV){
    // 对于自定义高级属性，如果已经在properties中存在，则更新其值；
    // 如果不存在，则添加新纪录
    input.customParamsKV.forEach( (oneProperty) => {
      let pnameAlreadyExists = false;
      input.PROPERTIES.props.forEach( (existingProperty) => {
        if(existingProperty.pname === oneProperty.pname){
          existingProperty.pvalue = oneProperty.pvalue;
          pnameAlreadyExists = true;
        }
      });
      if(!pnameAlreadyExists){
        input.PROPERTIES.props.push(oneProperty);
      }
    });

    // 对于用户在界面中删除的属性，需要在合并后的props中删除掉
    if(input.customDeleteProps){
      input.customDeleteProps.forEach( (oneProperty) => {
        input.PROPERTIES.props.forEach( (existingProperty) => {
          if(existingProperty.pname === oneProperty.pname){
            input.PROPERTIES.props.splice(input.PROPERTIES.props.indexOf(existingProperty),1);
          }
        });
      });
    }
  }
  input.properties = JSON.stringify(input.PROPERTIES);

}

module.exports = {
  _getRunningTime: _getRunningTime,
  _getRunningTimeStormJob: _getRunningTimeStormJob,
  _getRunningTimeFromTask: _getRunningTimeFromTask,
  _getRunningTimeStormJobFromOneJob: _getRunningTimeStormJobFromOneJob,
  formatValidator:formatValidator,
  checkDataValidation:checkDataValidation,
  dealDataInterfaceProperties:dealDataInterfaceProperties,
  handleAdvancedProperties:handleAdvancedProperties,
  handleAdvancedPropertiesOfInput:handleAdvancedPropertiesOfInput
};


