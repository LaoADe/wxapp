const app = getApp();
var skey = wx.getStorageSync("skey");

Page({
  data: {
    //判断小程序的API，回调，参数，组件等是否在当前版本可用。
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  onLoad: function() {
    var that = this;
    // 查看third_Session
    if (skey) {
      console.log("skey存在");
      // 检查 session_key 是否过期
      wx.checkSession({
        // session_key 有效(未过期)
        success: function() {
          console.log("session_key 有效(未过期)")
          that.doSkey();
          // 业务逻辑处理
        },
        // session_key 过期
        fail: function() {
          // session_key过期，重新登录
          console.log("session_key过期")
          that.doLogin();
        }
      });
    } else {
      console.log("skey不存在")
    }
  },
  bindGetUserInfo: function(e) {
    console.log(e.detail)
    if (e.detail.userInfo) {
      //授权成功后，跳转进入小程序首页
      this.doLogin();
    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击了“返回授权”')
          }
        }
      })
    }
  },
  doSkey: function() {
    wx.request({
      url: 'http://localhost:8080/skey', //自己的服务接口地址
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        skey: skey
      },
      success: function(res) {
        console.log("前台skey存在，校验skey后返回值" + JSON.stringify(res.data));
        //如果后台缓存已经不在了
        if (!res.data.success) {
          console.log("如果后台缓存已经失效了,小程序清空token和userinfo和openid");
          wx.removeStorageSync("skey");
          doLogin();
        } else {
          console.log("后台缓存中的信息也存在,直接返回");
          // 进入主页
          wx.redirectTo({
            url: '/pages/index/index'
          })
        }
      }
    });
  },
  doLogin: function() {
    wx.login({
      success: function(res) {
        console.log(res)
        var code = res.code; //登录凭证
        if (code) {
          //2、调用获取用户信息接口
          wx.getUserInfo({
            success: function(res) {
              console.log({
                encryptedData: res.encryptedData,
                iv: res.iv,
                code: code
              })
              //3.请求自己的服务器，解密用户信息 获取unionId等加密信息
              wx.request({
                url: 'http://localhost:8080/decodeUserInfo', //自己的服务接口地址
                method: 'post',
                header: {
                  'content-type': 'application/x-www-form-urlencoded'
                },
                data: {
                  encryptedData: res.encryptedData,
                  iv: res.iv,
                  code: code
                },
                success: function(data) {
                  console.log(data)

                  //4.解密成功后 获取自己服务器返回的结果
                  if (data.data.status == 1) {
                    var userInfo_ = data.data.userInfo;
                    console.log(userInfo_)
                    wx.setStorage({
                      key: "skey",
                      data: userInfo_.skey
                    })
                    wx.redirectTo({
                      url: '/pages/index/index'
                    })
                  } else {
                    console.log('解密失败')
                  }

                },
                fail: function() {
                  console.log('系统错误')
                }
              })
            },
            fail: function() {
              console.log('获取用户信息失败')
            }
          })

        } else {
          console.log('获取用户登录态失败！' + r.errMsg)
        }
      },
      fail: function() {
        console.log('登陆失败')
      }
    })
  },
})