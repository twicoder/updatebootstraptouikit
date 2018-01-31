let _createEventDataTempate = {
    streamid: {
        "required": true
    },
    name: {
        "required": true
    },
    uniqKeys: {
        "required": true
    },
    select_expr: {
        "required": true
    },
    filter_expr: {
        "required": true
    },
    p_event_id: {
        "required": true
    },
    STREAM_EVENT_CEP: {
        "required": true
    },
    output: {
        "required": true
    },
    status: {
        "required": true
    },
    owner: {
        "required": true
    },
    descriptioin: {
        "required": false
    }
};

module.exports = {
    createEvent: _createEventDataTempate
};