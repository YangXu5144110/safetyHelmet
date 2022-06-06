var common = {

	//正式服
	url: 'https://mini.tangdoush.com',

	pageSize: 15,
	layerLoad: [],

	//提示信息
	toast: function(settings) {
		let content = ''
		if (settings.message) {
			content = settings.message
		} else {
			content = settings.title
		}

		layer.open({
			content: content,
			skin: 'msg',
			time: 2 //2秒后自动关闭
		});
	},

	//退出登录
	signOut: function() {
		localStorage.removeItem("username");
		// localStorage.removeItem("token");
		window.location.href = "login.html";
	},

	goUrl: function(url) {
		var timestamp = Date.parse(new Date());
		window.location.href = '/scsSrv/actHome/' + url + '?timestamp='+timestamp;
	},

	//网络请求
	ajax: function(settings) {
		var defaults = {
			method: 'post',
			gateway: 'edu',
			operate: false,
			url: '',
			success: function(response) {}
		};
		settings = $.extend(defaults, settings);

		if(localStorage.getItem('token')) {
			settings.data.hexiao_token = localStorage.getItem('token')
		}

		let postUrl = '';
		postUrl = common.url + settings.url;
		
		if(settings.isUpload) {
			postUrl = settings.url
		}

		if (settings.tip) {
			layer.open({
				content: settings.tip,
				btn: ['确定', '取消'],
				yes: function(index) {
					common.http(settings, postUrl);
					layer.close(index);
				}
			});
		} else {
			common.http(settings, postUrl);
		}
	},

	http: function(settings, postUrl) {
		let headers = {}
		if (settings.headers) {
			headers = settings.headers
		}

		let index = layer.open({
			type: 2,
			content: '加载中'
		});
		settings.$http({
			headers: headers,
			method: settings.method,
			url: postUrl,
			data: settings.data,
		}).then(function successCallback(response) {
			console.log(response)
			var data = response.data;
			layer.close(index)
			if (data.code == 1) {
				if (settings.operate) {
					common.toast({
						title: "操作成功"
					});
				}

				if (data.data && data.data.content) {
					// settings.success(data.data.content);
					settings.success(data.data);
				} else if (data.data) {
					settings.success(data.data);
				} else {
					settings.success(data);
				}

			} else if (data.code == 2) {
				common.toast({
					type: 2,
					title: "操作失败",
					message: '登录信息已过期，请重新登录'
				});
				setTimeout(common.signOut(), 2000 )
			} else {
				if (settings.error) {
					settings.error(data)
				}
				layer.close(index)
				common.toast({
					type: 2,
					title: settings.url + "操作失败",
					message: data.msg
				});
				if (settings.error) {
					settings.error(response);
				}
			}
			window.setTimeout(function() {
				// Metronic.unblockUI();
			});
		}, function errorCallback(response) {
			layer.close(index)
			window.setTimeout(function() {
				// Metronic.unblockUI();
			});
			common.toast({
				type: 2,
				title: "网络异常"
			});
			if (settings.error) {
				settings.error(response)
			}
		});
	},

	ajax2: function(settings) {
		settings.gateway = 'quiz';
		common.ajax(settings);
	},

	addTitleForQuestion: function(settings) {
		$(settings.questionArr).each(function() {
			if (settings.select) {
				this.select = true;
			}
			console.log(this)
			if (this.examType == "single") {
				this.title = this.choiceQstTxt + "（单选）";
			} else if (this.examType == "multiple") {
				this.title = this.choiceQstTxt + "（多选）";
			} else if (this.examType == "trueOrFalse") {
				this.title = this.choiceQstTxt + "（判断）";
			} else if (this.examType == "design") {
				this.title = this.choiceQstTxt + "（主观）";
			}
			if (this.verifyStatus == '1') {
				this.title = this.title + '(待审核)'
			} else if (this.verifyStatus == '2') {
				this.title = this.title + '(审核未通过)'
			}

		});
		return settings.questionArr;
	},

	//上传文件
	fileUpload: function(settings) {
		let url = common.uploadUrl;
		if (settings.type == 'excel') {
			url = common.url + settings.url;
		}

		let options = {
			// 选完文件后，是否自动上传。
			auto: true,
			// swf文件路径
			swf: '/js/Uploader.swf',
			// 文件接收服务端。
			server: url,
			// 选择文件的按钮。可选。
			// 内部根据当前运行是创建，可能是input元素，也可能是flash.
			pick: '#' + settings.id,
			headers: {
				// token: localStorage.getItem("token")
			},
			duplicate: true
		}
		if (settings.options) {
			options = $.extend(options, settings.options);
		}

		// 初始化Web Uploader
		var uploader = WebUploader.create(options);

		uploader.on('fileQueued', function(file) {
			console.log(file);
			var flag = common.checkFileExt(file.name, settings.type);
			if (flag && settings.fileQueued) {
				settings.fileQueued(file.name);
			}
		})


		uploader.on('uploadBeforeSend', function(block, data, headers) {
			// console.log( uploader.getFiles() );
			if (settings.beforeSend) {
				let rtn = settings.beforeSend()
				if (!rtn.continue) {
					common.toast({
						title: rtn.title,
						type: 2
					});
					uploader.removeFile(data.id, true);
					uploader.cancelFile(data.id, true);
					return false
				}
			}
			var flag = common.checkFileExt(data.name, settings.type);
			// console.log(data);
			if (!flag) {
				uploader.removeFile(data.id, true);
				uploader.cancelFile(data.id, true);
				console.log(uploader.getFiles());
			} else {
				index = layer.load(2);
				common.layerLoad.push(index)
			}

		})

		uploader.on('uploadSuccess', function(file, response) {
			layer.close(common.layerLoad[0])
			common.layerLoad.shift()
			settings.success(file, response, uploader);
		});

		uploader.on('uploadError', function(file, response) {
			console.log(file)
			layer.close(index)
			common.toast({
				title: "上传失败",
				type: 2
			});
		});
		if (options.uploadBtn && !options.auto) {
			$("#" + options.uploadBtn).on('click', function() {
				uploader.upload();
			});
		}

	},

	//校验文件后缀
	checkFileExt: function(filename, filetype) {
		var flag = false; //状态
		var arr = [];

		if (filetype == 'doc') {
			arr = ['doc', 'docx', 'txt']
		} else if (filetype == 'audio') {
			arr = ["mp3"];
		} else if (filetype == 'video') {
			arr = ["mp4"];
		} else if (filetype == 'pic') {
			arr = ["jpg", "png"];
		} else if (filetype == 'ppt') {
			arr = ["ppt", "pptx"];
		} else if (filetype == 'excel') {
			arr = ["xls", "xlsx"];
		} else if (filetype == 'docAll') {
			arr = ['doc', 'docx', 'txt', "ppt", "pptx", "xls", "xlsx"];
		}

		//取出上传文件的扩展名
		var index = filename.lastIndexOf(".");
		var ext = filename.substr(index + 1);
		//循环比较
		for (var i = 0; i < arr.length; i++) {
			if (ext == arr[i]) {
				flag = true; //一旦找到合适的，立即退出循环
				break;
			}
		}
		var text = arr.join(',');
		//条件判断
		if (!flag) {
			layer.alert('文件不合法,只支持' + text + '格式');
		}

		return flag;
	},

	//数组排序
	compare: function(prop) {
		return function(obj1, obj2) {
			var val1 = obj1[prop];
			var val2 = obj2[prop];
			if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
				val1 = Number(val1);
				val2 = Number(val2);
			}
			if (val1 < val2) {
				return -1;
			} else if (val1 > val2) {
				return 1;
			} else {
				return 0;
			}
		}
	},


	//对象转url参数
	parseParams: function(data) {
		try {
			var tempArr = [];
			for (var i in data) {
				var key = encodeURIComponent(i);
				var value = encodeURIComponent(data[i]);
				tempArr.push(key + '=' + value);
			}
			var urlParamsStr = tempArr.join('&');
			return urlParamsStr;
		} catch (err) {
			return '';
		}
	},

	//获取url中的参数
	getQueryString: function(name) {
		var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
		let search = encodeURI(window.location.search)
		var r = search.substr(1).match(reg);
		if (r != null) {
			return decodeURI(unescape(r[2]));
		}
		return null;
	},

	//uuid
	guid: function() {
		return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	
	//截取字符串
	cutStr: function(str, num) {
		let rtn = ""
		if(str.length >= num) {
			rtn = str.substring(0, num) + '...'
		}
		return rtn
	},

	//获取指定日期之后N天的日期
	getNewDate: function(dateTemp, days) {
		var dateTemp = dateTemp.split("-");
		var nnDate = dateTemp[1] + '-' + dateTemp[2] + '-' + dateTemp[0]; //转换为MM-DD-YYYY格式    
		var nDate = new Date(nnDate.replace(/\s+/g, "")); //这一步如果没有空格的话可以省略
		var millSeconds = Math.abs(nDate) + (days * 24 * 60 * 60 * 1000);
		var rDate = new Date(millSeconds);
		var year = rDate.getFullYear();
		var month = rDate.getMonth() + 1;
		if (month < 10) month = "0" + month;
		var date = rDate.getDate();
		if (date < 10) date = "0" + date;
		return (year + "-" + month + "-" + date);
	},

	//加载列表
	loadDataList: function(settings) {
		if (!settings.$scope.currentPage) {
			settings.$scope.currentPage = 1
		}

		let postData = {
			"page": settings.$scope.currentPage - 1,
			"size": common.pageSize,
			// sortVo: {
			// 	"page": settings.$scope.currentPage - 1,
			// 	"size": settings.$rootScope.pageSize,
			// }
		};
		let method = 'post';
		if (settings.method) {
			method = settings.method
		}

		if (settings.$scope.searchObj) {
			postData = Object.assign(postData, settings.$scope.searchObj);
		}

		if (!postData.centerAreaId) {
			postData.centerAreaId = ''
		}

		common.ajax({
			headers: {
				userType: 'c'
			},
			method: method,
			$scope: settings.$scope,
			$http: settings.$http,
			data: postData,
			url: settings.url,
			success: function(res) {
				// if (!res.content) {
				// 	res.content = res;
				// }
				settings.$scope.totalItems = res.totalPages;
				settings.$scope.bigTotalItems = res.totalElements;
				if (settings.rtnData) {
					settings.$scope[settings.rtnData] = res.resList;
				} else {
					settings.$scope.data = res.resList;
				}
				// settings.$scope.totalElements = res.totalElements
				let numStart = res.number * common.pageSize + 1
				let numEnd = numStart + res.numberOfElements - 1
				settings.$scope.nums = numStart + '-' + numEnd
				if (settings.success) {
					settings.success(res.resList)
				}
			}
		});
	}

}

//格式化日期
Date.prototype.format = function (fmt) {
  var o = {
   "M+": this.getMonth() + 1, //月份
   "d+": this.getDate(), //日
   "h+": this.getHours(), //小时
   "m+": this.getMinutes(), //分
   "s+": this.getSeconds(), //秒
   "q+": Math.floor((this.getMonth() + 3) / 3), //季度
   "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
   if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
 }
