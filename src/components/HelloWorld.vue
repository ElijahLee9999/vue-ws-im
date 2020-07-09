<template>
  <div class="hello">
    <div id="msgdiv" style="height: 500px;overflow-y: scroll;">
      <template v-for="(item, index) in chatMsgList">
        <el-row :gutter="20" v-bind:key="index">
          <el-col :span="4" v-if="index%2==0">
            <div class="grid-content bg-purple">
              {{ item.msgContent }}
              <br />
              {{ item.createTime }}
            </div>
          </el-col>
          <el-col :span="4" style="float: right" v-if="index%2==1">
            <div class="grid-content bg-purple">
              {{ item.msgContent }}
              <br />
              {{ item.createTime }}
            </div>
          </el-col>
        </el-row>
      </template>
    </div>

    <el-input type="textarea" :rows="2" placeholder="请输入内容" v-model="msg"></el-input>
    <el-button type="primary" @click="sendMsg">Http发送</el-button>
    <el-button type="success" @click="sendWsMsg">WebSocket发送</el-button>
  </div>
</template>

<script>
import protoRoot from "@/proto/proto";
const WsReqProto = protoRoot.lookup("protocol.WsReqProto");
const WsRespProto = protoRoot.lookup("protocol.WsRespProto");

export default {
  name: "HelloWorld",
  
  data: () => ({
    current: 0,
    msg: "",
    chatMsgList: [],
    webSocket: null,
    webSocketReconnectCount: 0,
    webSocketIsReconnect: true, // 是否重连
    webSocketWarningText: "连接断开,正在尝试重连 <i class='dotting'></i>",
    webSocketIsOpen: false,
    // 心跳定时器
    webSocketPingTimer: null,
    webSocketPingTime: 10000, // 心跳的间隔，当前为 10秒,
    //webSocketUrl: "ws://192.168.1.141:18080/ws",
    webSocketUrl: "ws://192.168.1.152:18080/ws",
    webSocketReconnectMaxCount: {
      type: Number,
      default: 5
    }
  }),
  methods: {
    wsResEncode(payload) {
      console.log("payload", payload);
      let errMsg = WsReqProto.verify(payload);
      console.log("buff 解析错误信息：", errMsg);
      // Create a new message
      const wsData = WsReqProto.create(payload);
      // Encode a message to an Uint8Array (browser) or Buffer (node)
      return WsReqProto.encode(wsData).finish();
    },
    // WebSocket 编码
    wsRespDecode(data, callback) {
      let reader = new FileReader();
      reader.readAsArrayBuffer(data);
      reader.onload = () => {
        const buf = new Uint8Array(reader.result);
        const response = WsRespProto.decode(buf);
        callback(response);
      };
    },
    sendMsg() {
      this.axios.post(
        "http://192.168.1.152:28080/msg/send",
        {
          msg: this.msg
        },
        {
          "content-type": "application/json",
          uid: "100"
        }
      );
    },
    sendWsMsg() {
      const payload = {
        type: 2,
        send: {
          wxUserId: 43,
          toWxUserId: 2,
          msgType: 0,
          msgContent: this.msg
        }
      };
      this.webSocketSend(payload);
    },
    // 断开连接时
    webSocketClose() {
      // 修改状态为未连接
      this.webSocketIsOpen = false;
      this.webSocket = null;
      // 判断是否重连
      if (this.webSocketIsReconnect && this.webSocketReconnectCount === 0) {
        // 第一次直接尝试重连
        this.webSocketReconnect();
      }
    },
    // 定时心跳
    webSocketPing() {
      this.webSocketPingTimer = setTimeout(() => {
        if (!this.webSocketIsOpen) {
          return false;
        }
        console.log("心跳");
        const payload = {
          type: 0
        };
        this.webSocketSend(payload);
        clearTimeout(this.webSocketPingTimer);
        // 重新执行
        this.webSocketPing();
      }, this.webSocketPingTime);
    },
    // 初始化 WebSocket
    webSocketInit() {
      this.webSocketWarningText =
        "连接断开,正在尝试重连 <i class='dotting'></i>";
      // 修改是否重连为 true
      this.webSocketIsReconnect = true;
      this.webSocket = new WebSocket(this.webSocketUrl);
      this.webSocket.onopen = this.webSocketHandleOpen;
      this.webSocket.onerror = this.webSocketHandleError;
      this.webSocket.onmessage = this.webSocketHandleMessage;
      this.webSocket.onclose = this.webSocketHandleClose;
    },
    // WebSocket 重连
    webSocketReconnect() {
      if (this.webSocketIsOpen) {
        return false;
      }
      this.webSocketReconnectCount += 1;
      // 判断是否到了最大重连次数
      if (this.webSocketReconnectCount >= this.webSocketReconnectMaxCount) {
        this.webSocketWarningText = "重连次数超限";
        return false;
      }
      // 初始化
      this.webSocketInit();

      // 每过 5 秒尝试一次，检查是否连接成功，直到超过最大重连次数
      let timer = setTimeout(() => {
        this.webSocketReconnect();
        clearTimeout(timer);
      }, 5000);
    },
    // WebSocket 打开成功后
    webSocketHandleOpen() {
      console.log("连接打开");
      this.webSocketIsOpen = true;
      // 清空重连的次数
      this.webSocketReconnectCount = 0;
      // 发送登录信息
      const payload = {
        type: 100000
      };
      this.webSocketSend(payload);
      // 开启定时心跳
      this.webSocketPing();
    },
    // WebSocket 关闭
    webSocketHandleClose() {
      console.log("连接断开");
      // 关闭心跳
      this.webSocketClose();
    },
    // WebSocket 发生错误时
    webSocketHandleError(err) {
      console.log("连接报错：", err);
      // 关闭心跳
      this.webSocketClose();
    },
    // 接收到消息时
    webSocketHandleMessage(event) {
      // 响应体的message
      const data = event.data;
      this.wsRespDecode(data, response => {
        console.log("服务端消息:", response);
        let type = response.type || 0;
        switch (type) {
          case -2: // 登录异常
            // 退出登录
            console.log("退出登录");
            break;
          case -1: // 异地登录
            // 通知下线
            this.wsOut();
            break;
          case 0:
            break;
          case 1: // 好友消息
            this.wsFriendMsgHandle(response);
            break;
        }
      });
    },
    wsOut() {
      this.webSocketWarningText = "异地登录请重新登录";
      // 修改重连状态
      this.webSocketIsReconnect = false;
      if (this.webSocket) {
        console.log("关闭websocket");
        // 关闭 websocket
        this.webSocket.close();
      }
    },
    // 消息类型的消息（好友消息）
    wsFriendMsgHandle(response) {
      let message = response.msg;
      this.chatMsgList.push(message);
      var div = document.getElementById("msgdiv");
      div.scrollTop = div.scrollHeight;
      let timer = setTimeout(() => {
        div.scrollTop = div.scrollHeight;
        clearTimeout(timer);
      }, 200);
    },
    // 发送ws消息
    webSocketSend(payload) {
      // 加入登录验证
      payload.uid = 100000;
      payload.token = 68703948898439168;
      let buffer = this.wsResEncode(payload);
      this.webSocket.send(buffer);
    }
  },
  created: function() {
    this.webSocketInit();
  }
};
</script>


<style>
.el-row {
  margin-bottom: 20px;
}
.el-col {
  border-radius: 4px;
}
.bg-purple-dark {
  background: #99a9bf;
}
.bg-purple {
  background: #d3dce6;
}
.bg-purple-light {
  background: #e5e9f2;
}
.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
.row-bg {
  padding: 10px 0;
  background-color: #f9fafc;
}
</style>