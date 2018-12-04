// 使用N-API编写的Addon

#define NAPI_VERSION 3

#include <node_api.h>
#include <stdio.h>
#include <assert.h>
#include <string.h>
#include <map>
#include "ln-addon.h"

namespace learning
{

class AddonData {
public:
	AddonData() { mid = seq; };
	~AddonData();

	int Clear(napi_env);

	// 尝试关联weak reference
	void SetWeak(napi_env env, napi_value obj) {
		napi_ref ref;
		std::map<napi_value, napi_ref>::iterator it = weakRef.find(obj);
		if (it == weakRef.end()) {
			napi_create_reference(env, obj, 1, &ref);
			weakRef.insert(std::pair<napi_value, napi_ref>(obj, ref));
		}
		else {
			uint32_t refCount;
			napi_reference_ref(env, it->second, &refCount);
		}
	};

	int32_t mid;
	char descr[64];

private:
	static int32_t seq;

	// pair<key, T> = <object, ref>
	std::map<napi_value, napi_ref> weakRef;
};

int32_t AddonData::seq = 0;

int AddonData::Clear(napi_env env) {
	if (!weakRef.empty()) {
		for (std::map<napi_value, napi_ref>::iterator it = weakRef.begin(); weakRef.end() != it; it++) {
			uint32_t refCount;
			napi_ref ref = it->second;
			napi_reference_unref(env, ref, &refCount);
			if (0 == refCount) {
				napi_delete_reference(env, ref);
				// weakRef.erase(it);
			}
		}
		weakRef.clear();
	}
}

napi_value Method(napi_env env, napi_callback_info args)
{
	napi_value greeting;
	napi_status status;
	napi_value argv[8];
	char buff[256];
	char result[256];
	size_t argc = sizeof(argv) / sizeof(argv[0]);
	napi_value thisArg;
	void *data;

	status = napi_get_cb_info(env, args, &argc, argv, &thisArg, &data);
	strcpy(result, (char *)data);
	if (status != napi_ok)
	{
		strcat(result, "\n获取回调函数信息失败!");
	}
	else
	{
		strcat(result, "\n Hello ");

		for (int i = 0;;)
		{
			status = napi_get_value_string_utf8(env, argv[i], buff, sizeof(buff), nullptr);
			if (status != napi_ok)
			{
				snprintf(buff, sizeof(result), "\n获取函数第 %d 个参数时失败!", i);
				strcat(result, buff);
				break;
			}
			else
			{
				strcat(result, buff);
				i++;
				if (i < (int)argc)
					strcat(result, " and ");
				else
					break;
			}
		}
	}

	status = napi_create_string_utf8(env, result, NAPI_AUTO_LENGTH, &greeting);

	if (status != napi_ok)
		return nullptr;

	return greeting;
}

inline napi_value FailureCode(napi_env env, int ret)
{
	napi_value retCode;

	if (napi_create_int32(env, ret, &retCode) == napi_ok)
		return retCode;
	else
		return nullptr;
}

napi_value TestObject(napi_env env, napi_callback_info info)
{
	napi_status status;
	char buff[256];
	char strRet[256];
	napi_value obj;
	size_t argc = 1;
	napi_value req, res;

	status = napi_get_cb_info(env, info, &argc, &obj, NULL, NULL);
	if (status != napi_ok)
		return FailureCode(env, -1);

	// argv[0]即指向JS Object的napi_value
	status = napi_get_named_property(env, obj, "request", &req);
	if (status != napi_ok)
		return FailureCode(env, -2);

	status = napi_get_value_string_utf8(env, req, buff, sizeof(buff), NULL);
	if (status != napi_ok)
		return FailureCode(env, -3);

	sprintf(strRet, "用中文回答：%s", buff);
	// strcpy(strRet, "我也说中文：");
	// strcat(strRet, buff);

	status = napi_create_string_utf8(env, strRet, NAPI_AUTO_LENGTH, &res);
	if (status != napi_ok)
		return FailureCode(env, -4);

	status = napi_set_named_property(env, obj, "response", res);
	if (status != napi_ok)
		return FailureCode(env, -5);

	return FailureCode(env, 0);
}

napi_value TestCallback(napi_env env, napi_callback_info info)
{
	napi_status status;
	napi_value cb;
	napi_value thisArg;
	size_t argc = 1;
	napi_value argv[4], result;

	status = napi_get_cb_info(env, info, &argc, &cb, &thisArg, nullptr);
	if (status != napi_ok)
		return FailureCode(env, -1);

	status = napi_create_string_utf8(env, "C Addon 调用 Javascript 函数一定很酷", NAPI_AUTO_LENGTH, &(argv[0]));
	if (status != napi_ok)
		return FailureCode(env, -2);

	// 测试分配一个buff, napi_create_buff(_copy),有点疑问，这个buff啥时候释放？
	char testStr[] = "这是C-Addon分配的空间";
	void *buff;

	/*+------------------------------------------------------------------------
	  | 理解：这个buff空间应该是Nodejs分配的，传递给addon，所以不用操心这个空间的管理，
	  | nodejs会回收的。其lifespan是这样的：napi_create_* （其实就是nodejs)分配, 
	  |	addon通过返回的指针(buff)可以访问，并传递给nodejs提供的callback函数，但
	  |	addon的这个方法退出时，nodejs也就回收了这个空间。（??) 
	  |	更合理的解释：napi_create_*分配的空间同其他对象一样，都是该模块有效，模块退出时，
	  |	这些空间和对象就都自动回收了（nodejs）。
	  | 由于Nodejs是单进程的，所以没有考虑多进程并发情况，而addon则可能被不同进程加载，也
	  | 可能存在线程并发访问的情况，这对应全局变量来说是危险的，所以需要context-aware机制，
	  | 需要在模块初始化时，为每个模块实例预留一个独立的空间，保存每个模块实例特有的数据，
	  | 而这些数据被传递给addon的方法使用（exports 方法时的（void* data））
	  +--------------------------------------------------------------------- */
	status = napi_create_buffer_copy(env, sizeof(testStr), testStr, &buff, &(argv[1]));
	if (status != napi_ok)
		return FailureCode(env, -4);

	argc = 2;
	status = napi_call_function(env, thisArg, cb, argc, argv, &result);
	if (status != napi_ok)
		return FailureCode(env, -3);

	return result;
}

static napi_value New(napi_env env, napi_callback_info info) {
    napi_status status;
    napi_value argv[2];
	napi_value exdata, ret;
    size_t argc = sizeof(argv) /sizeof(argv[0]);
	void* data;
	MyPoint* point;

    status = napi_get_cb_info(env, info, &argc, argv, NULL, (void**) &exdata);
    assert(napi_ok == status);
	assert(napi_ok == napi_typeof(env, exdata, NULL));

	napi_get_value_external(env, exdata, &data);

	if (0 == argc) {
		point = new MyPoint();
	}
	else if (2 == argc) {
		double x, y;
		napi_get_value_double(env, argv[0], &x);
		napi_get_value_double(env, argv[1], &y);
		point = new MyPoint(x, y);
	}
	else {
		return NULL;
	}

	status = napi_create_object(env, )
}

static napi_value Set(napi_env env, napi_callback_info info) {
	MyPoint();
}

static napi_value Get(napi_env env, napi_callback_info info) {
	MyPoint();
}

void Finalizer(napi_env env, void* data, void* hint) {
	AddonData* ad = (AddonData*)data;
	ad->Clear(env);
	delete ad;
}

napi_value init(napi_env env, napi_value exports)
{
	static int32_t mid = 0;

	napi_status status;
	napi_value global;
	napi_value exAddon;
	napi_value cons;		// constructor for myPoint
	napi_ref ref;

	/*
		分配一块空间，使用napi_create_external_*生成一个external（不是js对象，而是napi_typeof()),
		再把这个external传递给模块方法，可以认为这个空间就是模块实例特有的空间。
		为什么需要external：JS Object的生存期（lifespan）仅在于其被调用执行期间，但有些时候，需要在
		JS Object的生存期之外对其进行访问（其实不是对该Object进行访问，而是访问该‘数据’（void*），就
		需要在Object外，生成一个空间供native code(C/C++实现的函数)访问，external就是这样一种存在，
		尤其是一些Object的constructor和异步调用的函数。
		为了保证这些external能被正常访问，又不会造成memory leak，还需要引入另外一个机制，weak 
		reference，weak是这样理解的：在没有实例访问之前，保证这些方法可以被访问，也就是weak ref，
		而一旦实例化，就变成了strong reference。
	*/

	AddonData *data = new AddonData();

	data->mid = mid ++;
	strcpy(data->descr, "就想看看定义函数中的 void* data 是个啥");

	status = napi_get_global(env, &global);
	if (status != napi_ok)
		return nullptr;

	/* external 还没有完全搞清楚，先撂下 */
	status = napi_create_external(env, data, Finalizer, NULL, &exAddon);
	assert(napi_ok == status);
	
	/*+------------------------------------------------------------------------
		Any non-NULL data which is passed to this API (napi_callback) via the
		data field of the napi_property_descriptor items can be associated with
		object and freed whenever object is garbage-collected by passing both
		object and the data	to napi_add_finalizer. 
	  +----------------------------------------------------------------------*/
	
	// 按照这个说法，把exAddon作为方法描述的参数(data)，将是它同该方法进行关联。

	napi_property_descriptor descr[] = {
		// {"utf8name", name, method, getter, setter, value, attributes, data}
		{"MyPoint", NULL, NULL, Set, Get, NULL, napi_default, (void*) exAddon},
		DECLARE_NAPI_METHOD("move", Move),
		DECLARE_NAPI_METHOD("distance", Distance)
	};

	status = napi_define_class(env, "myPoint", NAPI_AUTO_LENGTH, New, NULL, sizeof(descr) / sizeof(descr[0]), descr, &cons);
	if(napi_ok != status) return NULL;

	data->pt_cons = cons;
	napi_create_reference(env, cons, 1, &ref);
	data->pt_cons_ref = ref;

	// 把 myPoint 导出到 global 上
	status = napi_set_named_property(env, global, "myPoint", cons);
	if (napi_ok != status) return NULL;

	// 导出Addon的其他方法
	descr = {// {"utf8name", name, method, getter, setter, value, attributes, data}
			 {"hello", NULL, Method, NULL, NULL, NULL, napi_default, (void *)(data->descr)},
			 {"testObj", NULL, TestObject, NULL, NULL, NULL, napi_default, NULL},
			 {"testCallback", NULL, TestCallback, NULL, NULL, NULL, napi_default, NULL}};

	status = napi_define_properties(env, exports, sizeof(descr) / sizeof(descr[0]), descr);
	if (status == napi_ok)
		return exports;
	else
		return nullptr;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
} // namespace learning
