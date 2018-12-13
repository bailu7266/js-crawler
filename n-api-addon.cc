// 使用N-API编写的Addon

#define NAPI_VERSION 3

#include <node_api.h>
#include <iostream>
#include <assert.h>
#include <string.h>
#include <list>
#include "ln-addon.h"

namespace learning
{
	/*
	#ifdef WE_ARE_HERE
	#undef WE_ARE_HERE
	#endif
	#define WE_ARE_HERE std::cout << "\nNow we are in line: " << __LINE__;
	*/
	class AddonData
	{
	public:
		AddonData()
		{
			mid = seq;
			refCons = refExports = refAd = NULL;
		};
		~AddonData(void) {};

		int Clear(napi_env);

		/*// 尝试关联weak reference
		void SetWeak(napi_env env, uint32_t count, napi_value obj)
		{
			napi_ref ref;
			napi_create_reference(env, obj, count, &ref);
			weakRef.push_back(ref);
		};*/
		void SetCons(napi_env env, napi_value cons)
		{
			assert(napi_ok == napi_create_reference(env, cons, 1, &refCons));
		}

		napi_value GetCons(napi_env env)
		{
			napi_value nv;
			assert(napi_ok == napi_get_reference_value(env, refCons, &nv));
			return nv;
		}

		void SetExports(napi_env env, napi_value exp)
		{
			assert(napi_ok == napi_create_reference(env, exp, 0, &refExports));
		}

		napi_value GetExports(napi_env env)
		{
			napi_value nv;
			assert(napi_ok == napi_get_reference_value(env, refExports, &nv));
			return nv;
		}

		void SetAddon(napi_env env, napi_value ad)
		{
			assert(napi_ok == napi_create_reference(env, ad, 1, &refAd));
		}

		napi_value GetAddon(napi_env env)
		{
			napi_value nv;
			assert(napi_ok == napi_get_reference_value(env, refAd, &nv));
			return nv;
		}

		napi_ref AddonRef() const { return refAd; };
		napi_ref ConsRef() const { return refCons; };
		napi_ref ExportsRef() const { return refExports; };

		int32_t mid;
		char descr[64];

	private:
		static int32_t seq;
		napi_ref refCons;
		napi_ref refExports;
		napi_ref refAd;
		// pair<key, T> = <object, ref>
		// std::list<napi_ref> weakRef;
	};

	int32_t AddonData::seq = 0;

	int AddonData::Clear(napi_env env)
	{
		/* if (!weakRef.empty())
		{
			for (std::list<napi_ref>::iterator it = weakRef.begin(); weakRef.end() != it; it++)
			{
				napi_delete_reference(env, it);
			}
			weakRef.clear();
		} */
		if (refCons)
		{
			napi_delete_reference(env, refCons);
			refCons = NULL;
		}
		if (refExports)
		{
			napi_delete_reference(env, refExports);
			refExports = NULL;
		}
		if (refAd)
		{
			napi_delete_reference(env, refAd);
			refAd = NULL;
		}

		return (int)0;
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
			strcpy(result, "\n获取回调函数信息失败!");
		}
		else
		{
			strcat(result, "\n Hello ");

			for (int i = 0;;)
			{
				status = napi_get_value_string_utf8(env, argv[i], buff, sizeof(buff), nullptr);
				if (status != napi_ok)
				{
					sprintf(buff, "\n获取函数第 %d 个参数时失败!", i);
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

		char str[] = "C Addon调用 Javascript 函数一定很酷\n";
		status = napi_create_string_utf8(env, str, sizeof(str), &(argv[0]));
		if (status != napi_ok)
			return FailureCode(env, -2);

		// 测试分配一个buff, napi_create_buff(_copy),有点疑问，这个buff啥时候释放？
		char testStr[] = "这是C-Addon分配的空间\n";
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

	size_t PtGetArgs(napi_env env, napi_callback_info info, napi_value argv[], napi_value *thisPtr, bool *is_instance, napi_value *consPtr = nullptr)
	{
		napi_status status;
		napi_ref refExdata;
		napi_value exdata;
		size_t argc = 2;
		AddonData *data;

		status = napi_get_cb_info(env, info, &argc, argv, thisPtr, (void **)&refExdata);
		assert(napi_ok == status);

		if (refExdata)
		{
			napi_get_reference_value(env, refExdata, &exdata);
			napi_valuetype vtype;
			napi_typeof(env, exdata, &vtype);
			assert(napi_external == vtype);

			napi_get_value_external(env, exdata, (void **)&data);

			napi_value cons = data->GetCons(env);
			if (consPtr)
				*consPtr = cons;

			napi_instanceof(env, *thisPtr, cons, is_instance);
		}
		else
		{ // (void*) data 在napi_define_class中传递(constructor的参数)
			*is_instance = false;
			if (consPtr)
				*consPtr = nullptr;
		}

		return argc;
	}

	void PtFinalizer(napi_env env, void *data, void *hint)
	{
		if (hint)
			std::cout << "\nLast word from: " << (char *)hint;
		delete (MyPoint *)data;
	}

	napi_value New(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		napi_value cons;
		MyPoint *point;
		bool is_instance = false;

		size_t argc = PtGetArgs(env, info, argv, &thisArg, &is_instance, &cons);

		double x, y;

		if (is_instance)
		{
			switch (argc)
			{
			case 0:
				point = new MyPoint();
				break;

			case 1:
			{
				// 此处需要检验argv[0]传入的napi_value是否是该class的实例
				bool bInst = false;
				napi_instanceof(env, argv[0], cons, &bInst);
				if (bInst)
				{
					// Construct from another instance
					MyPoint *sp;
					napi_unwrap(env, argv[0], (void **)&sp);
					point = new MyPoint(sp->GetX(), sp->GetY());
				}
				else
				{
					// 参数类型不对，应该throw an exception, 下面是一个尝试，不一定对。
					point = nullptr;
					napi_throw_error(env, "E_ARG_TYPE", "参数类型不对");
				}
			}
			break;

			case 2:
			default:
				napi_get_value_double(env, argv[0], &x);
				napi_get_value_double(env, argv[1], &y);
				point = new MyPoint(x, y);
			}

			// 既然this不是class instance, 所以需要创建一个该类的instance
			// assert(napi_ok == napi_create_object(env, &thisArg));
			/* already-created JavaScript object that is the this argument to the constructor callback.
			   That this object was created from the constructor function's prototype,
			   so it already has definitions of all the instance properties and methods. */
			assert(napi_ok == napi_wrap(env, thisArg, (void *)point, PtFinalizer, (void *)"New myPoint", NULL));

			return thisArg;
		}

		// 这会是什么情况：应该是通过class/constructor名字直接调用了constructor，而没有使用new，所以传入的this不是class instance，
		// 而是其调用时的当前object的this handler
		napi_throw_error(env, "UNDEF_FUNC", "该函数在当前范围中未定义");
		return NULL;
	}

	napi_value SetX(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		MyPoint *point;
		bool is_instance = false;

		size_t argc = PtGetArgs(env, info, argv, &thisArg, &is_instance);

		if (!is_instance)
		{
			// throw an exception
			napi_throw_error(env, "WRONG_PROTO", "Wrong prototype for this property");
			return NULL;
		}

		if (0 == argc)
		{
			// No argument, throw an exception
			napi_throw_error(env, "LACK_ARG", "Insufficient arguments");
			return NULL;
		}

		double x;
		napi_get_value_double(env, argv[0], &x);
		napi_unwrap(env, thisArg, (void **)&point);

		point->SetX(x);

		return thisArg;
	}

	napi_value SetY(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		MyPoint *point;
		bool is_instance = false;

		size_t argc = PtGetArgs(env, info, argv, &thisArg, &is_instance);

		if (!is_instance)
		{
			// throw an exception
			napi_throw_error(env, "WRONG_PROTO", R"(Wrong prototype for this property)");
			return NULL;
		}

		if (0 == argc)
		{
			// No argument, throw an exception
			napi_throw_error(env, "LACK_ARG", "Insufficient arguments");
			return NULL;
		}

		double y;
		napi_get_value_double(env, argv[0], &y);
		napi_unwrap(env, thisArg, (void **)&point);

		point->SetY(y);

		return thisArg;
	}

	napi_value GetX(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		MyPoint *point;
		bool is_instance = false;

		PtGetArgs(env, info, argv, &thisArg, &is_instance);

		if (is_instance)
		{
			napi_unwrap(env, thisArg, (void **)&point);
			napi_value x_value;
			double x = point->GetX();
			napi_create_double(env, x, &x_value);

			return x_value;
		}

		// throw an exception
		napi_throw_error(env, "WRONG_PROTO", "Wrong prototype for this property");
		return NULL;
	}

	napi_value GetY(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		MyPoint *point;
		bool is_instance = false;

		PtGetArgs(env, info, argv, &thisArg, &is_instance);

		if (is_instance)
		{
			napi_unwrap(env, thisArg, (void **)&point);
			napi_value y_value;
			double y = point->GetY();
			napi_create_double(env, y, &y_value);

			return y_value;
		}

		// throw an exception
		napi_throw_error(env, "WRONG_PROTO", "Wrong prototype for this property");
		return NULL;
	}

	napi_value Move(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		MyPoint *point;
		bool is_instance = false;

		size_t argc = PtGetArgs(env, info, argv, &thisArg, &is_instance);

		if (!is_instance)
		{
			// throw an exception
			napi_throw_error(env, "WRONG_PROTO", "Wrong prototype for this property");
			return NULL;
		}

		if (2 < argc)
		{
			// Not enough arguments, should throw an exception
			napi_throw_error(env, "LACK_ARG", "Insufficient arguments");
			return NULL;
		}

		double x, y;
		napi_get_value_double(env, argv[0], &x);
		napi_get_value_double(env, argv[1], &y);
		napi_unwrap(env, thisArg, (void **)&point);

		point->Move(x, y);

		return thisArg;
	}

	napi_value Distance(napi_env env, napi_callback_info info)
	{
		napi_value argv[2];
		napi_value thisArg;
		napi_value cons;
		MyPoint *point;
		bool is_instance = false;

		size_t argc = PtGetArgs(env, info, argv, &thisArg, &is_instance, &cons);

		if (!is_instance)
		{
			// throw an exception
			napi_throw_error(env, "WRONG_PROTO", "Wrong prototype for this property");
			return NULL;
		}

		if (0 == argc)
		{
			// throw an exception
			napi_throw_error(env, "LACK_ARG", "Insufficient arguments");
			return NULL;
		}

		napi_value value;
		double dist;

		assert(napi_ok == napi_unwrap(env, thisArg, (void **)&point));

		if (1 == argc)
		{
			// 此处需要检验argv[0]传入的napi_value是否是该class的实例
			bool bInst = false;
			napi_instanceof(env, argv[0], cons, &bInst);
			if (bInst)
			{
				// Construct from another instance
				MyPoint *sp;
				napi_unwrap(env, argv[0], (void **)&sp);
				dist = point->Distance(*sp);
			}
			else
			{
				// 参数类型不对，应该throw an exception, 下面是一个尝试，不一定对。
				point = nullptr;
				napi_throw_error(env, "E_ARG_TYPE", "参数类型不对");
				return NULL;
			}
		}
		else
		{
			double x, y;
			napi_get_value_double(env, argv[0], &x);
			napi_get_value_double(env, argv[1], &y);

			dist = point->Distance(x, y);
		}

		napi_create_double(env, dist, &value);

		return value;
	} // namespace learning

	void AdFinalizer(napi_env env, void *data, void *hint)
	{
		if (hint)
			std::cout << "\nLast word from: " << (char *)hint;

		AddonData *ad = (AddonData *)data;
		ad->Clear(env);
		delete ad;
	}

	napi_value init(napi_env env, napi_value exports)
	{
		napi_status status;
		napi_value global;
		napi_value exdata;
		napi_value cons; // constructor for myPoint

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
		strcpy(data->descr, "就想看看定义函数中的 void* data 是个啥");
		data->SetExports(env, exports);

		status = napi_get_global(env, &global);
		if (status != napi_ok)
			return nullptr;

		/* external 还没有完全搞清楚，先撂下 */
		status = napi_create_external(env, data, AdFinalizer, (void *)"Addon Data", &exdata);
		assert(napi_ok == status);

		data->SetAddon(env, exdata);

		/*+------------------------------------------------------------------------
			Any non-NULL data which is passed to this API (napi_callback) via the
			data field of the napi_property_descriptor items can be associated with
			object and freed whenever object is garbage-collected by passing both
			object and the data	to napi_add_finalizer.
		  +----------------------------------------------------------------------*/

		  // 按照这个说法，把exAddon作为方法描述的参数(data)，将是它同该方法进行关联。

		napi_ref adRef = data->AddonRef();

		napi_property_descriptor descr[] = {
			// {"utf8name", name, method, getter, setter, value, attributes, data}
			{"x", NULL, NULL, GetX, SetX, NULL, napi_default, (void *)adRef},
			{"y", NULL, NULL, GetY, SetY, NULL, napi_default, (void *)adRef},
			{"move", NULL, Move, NULL, NULL, NULL, napi_default, (void *)adRef},
			{"distance", NULL, Distance, NULL, NULL, NULL, napi_default, (void *)adRef} };

		status = napi_define_class(env, "MyPoint", NAPI_AUTO_LENGTH, New, (void *)adRef, sizeof(descr) / sizeof(descr[0]), descr, &cons);
		if (napi_ok != status)
			return NULL;

		data->SetCons(env, cons);

		// 把 myPoint 导出到 global 上
		status = napi_set_named_property(env, global, "MyPoint", cons);
		if (napi_ok != status)
			return NULL;

		// 导出Addon的其他方法
		napi_property_descriptor descr1[] = {// {"utf8name", name, method, getter, setter, value, attributes, data}
											 {"hello", NULL, Method, NULL, NULL, NULL, napi_default, (void *)(data->descr)},
											 {"testObj", NULL, TestObject, NULL, NULL, NULL, napi_default, NULL},
											 {"testCallback", NULL, TestCallback, NULL, NULL, NULL, napi_default, NULL} };

		status = napi_define_properties(env, exports, sizeof(descr1) / sizeof(descr1[0]), descr1);
		if (status == napi_ok)
			return exports;
		else
			return nullptr;
	}

	NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
} // namespace learning
