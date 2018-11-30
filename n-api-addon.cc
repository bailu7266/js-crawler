// 使用N-API编写的Addon

#define NAPI_VERSION 3

#include <node_api.h>
#include <stdio.h>
#include <string.h>

namespace learning {

	napi_value Method(napi_env env, napi_callback_info args) {
		napi_value greeting;
		napi_status status;
		napi_value argv[8];
		char buff[256];
		char result[256];
		size_t argc = sizeof(argv);
		napi_value thisArg;
		void* data;

		status = napi_get_cb_info(env, args, &argc, argv, &thisArg, &data);
		if (status != napi_ok) {
			strcpy(result, "\n获取回调函数信息失败!");
		}
		else {
			strcpy(result, "\n Hello ");

			for (int i = 0;;) {
				status = napi_get_value_string_utf8(env, argv[i], buff, sizeof(buff), nullptr);
				if (status != napi_ok) {
					snprintf(buff, sizeof(result), "\n获取函数第 %d 个参数时失败！ ", i);
					strcat(result, buff);
					break;
				}
				else {
					strcat(result, buff);
					i++;
					if (i < argc)
						strcat(result, " and ");
					else
						break;
				}
			}
		}

		status = napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &greeting);

		if (status != napi_ok) return nullptr;

		return greeting;
	}

	inline napi_value FailureCode(napi_env env, int ret) {
		napi_value retCode;
		
		if (napi_create_int32(env, ret, &retCode) == napi_ok)
			return retCode;
		else
			return nullptr;
	}

	napi_value TestObject(napi_env env, napi_callback_info info) {
		napi_status status;
		char buff[256];
		char strRet[256];
		napi_value obj;
		size_t argc = 1;
		napi_value req, res;
		
		status = napi_get_cb_info(env, info, &argc, &obj, NULL, NULL);
		if (status != napi_ok) return FailureCode(env, -1);

		// argv[0]即指向JS Object的napi_value
		status = napi_get_named_property(env, obj, "request", &req);
		if (status != napi_ok) return FailureCode(env, -2);

		status = napi_get_value_string_utf8(env, req, buff, sizeof(buff), NULL);
		if (status != napi_ok) return FailureCode(env, -3);

		sprintf(strRet, "用中文回答：%s", buff);
		// strcpy(strRet, "我也说中文：");
		// strcat(strRet, buff);

		status = napi_create_string_utf8(env, strRet, NAPI_AUTO_LENGTH, &res);
		if (status != napi_ok) return FailureCode(env, -4);

		status = napi_set_named_property(env, obj, "response", res);
		if (status != napi_ok) return FailureCode(env, -5);

		return FailureCode(env, 0);
	}

	napi_value init(napi_env env, napi_value exports) {
		napi_status status;
		napi_value fn;

		status = napi_create_function(env, nullptr, 0, Method, nullptr, &fn);
		if (status != napi_ok) return nullptr;

		status = napi_set_named_property(env, exports, "hello", fn);
		if (status != napi_ok) return nullptr;

		status = napi_create_function(env, nullptr, 0, TestObject, nullptr, &fn);
		if (status != napi_ok) return nullptr;

		status = napi_set_named_property(env, exports, "testObj", fn);
		if (status != napi_ok) return nullptr;

		return exports;
	}

	NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
}
