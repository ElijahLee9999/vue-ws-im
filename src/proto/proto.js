/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/light");

var $root = ($protobuf.roots["default"] || ($protobuf.roots["default"] = new $protobuf.Root()))
.addJSON({
  protocol: {
    options: {
      optimize_for: "SPEED",
      java_package: "com.ykt.wxim.websocket.protobuf"
    },
    nested: {
      WsMsgProto: {
        fields: {
          id: {
            type: "int64",
            id: 1
          },
          wxUserId: {
            type: "int32",
            id: 2
          },
          toWxUserId: {
            type: "int32",
            id: 3
          },
          senderUid: {
            type: "int32",
            id: 4
          },
          msgType: {
            type: "int32",
            id: 5
          },
          msgContent: {
            type: "string",
            id: 6
          },
          createTime: {
            type: "string",
            id: 7
          }
        }
      },
      WsReqProto: {
        fields: {
          type: {
            type: "int32",
            id: 1
          },
          uid: {
            type: "int32",
            id: 2
          },
          token: {
            type: "int64",
            id: 3
          },
          send: {
            type: "WsSendProto",
            id: 4
          }
        }
      },
      WsSendProto: {
        fields: {
          wxUserId: {
            type: "int32",
            id: 1
          },
          toWxUserId: {
            type: "int32",
            id: 2
          },
          msgType: {
            type: "int32",
            id: 3
          },
          msgContent: {
            type: "string",
            id: 4
          }
        }
      },
      WsRespProto: {
        fields: {
          type: {
            type: "int32",
            id: 1
          },
          online: {
            type: "bool",
            id: 3
          },
          msg: {
            type: "WsMsgProto",
            id: 4
          }
        }
      }
    }
  }
});

export default $root;
