// JS Addon learning: hello.cc

#include <node.h>

namespace learning {
    using v8::FunctionCallbackInfo;
    using v8::Isolate;
    using v8::Local;
    using v8::Object;
    using v8::String;
    using v8::Value;

    using namespace v8;
    /* 由于Addon可能被多次被不同的node载入，为了保护全局静态数据不被错误引用，需要创建一个类来应当 */
    class AddonData {
        public:
        AddonData(Isolate* isolate, Local<Object> exports) : call_count (0) {
            // Link the existence of this object instance to the existence of exports.
            exports_.Reset(isolate, exports);
            exports_.SetWeak(this, DeleteMe, WeakCallbackType::kParameter);
        }

        ~AddonData() {
            // 防止内存泄漏，需要清空这些引用
            if (!exports_.IsEmpty()) {
                exports_.ClearWeak();
                exports_.Reset();
            }
        }

        // 每个Addon实例的数据
        int call_count;

        private:
            // "exports" 将要被垃圾回收程序回收的时候调用的方法
            void static DeleteMe(const WeakCallbackInfo<AddonData>& info) {
                delete info.GetParameter();
            }

            v8::Persistent<v8::Object> exports_;
    };

    void static Method(const v8::FunctionCallbackInfo<v8::Value>& info) {
        // 提前每个Addon实例的数据 (AddonData)
        AddonData* data = reinterpret_cast<AddonData*>(info.Data().As<External>()->Value());
        data->call_count ++;
        info.GetReturnValue().Set((double)data->call_count);
    }

    // 用 NODE_MODULE_INIT 初始化 context-aware Addon
    NODE_MODULE_INIT(/* exports, module, context */) {
        Isolate* isolate = context->GetIsolate();

        // 为这个Addon实例生产一个AddonData实例
        AddonData* data = new AddonData(isolate, exports);
        // 把 data 包装进一个 v8::External, 以便把它传递给导出的方法
        Local<External> external = External::New(isolate, data);

        exports->Set(context,
            String::NewFromUtf8(isolate, "method", NewStringType::kNormal).ToLocalChecked(),
            FunctionTemplate::New(isolate, Method, external)
            ->GetFunction(context).ToLocalChecked()).FromJust();
    }

    /*
    void Hello(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world", NewStringTyp::kNormal).ToLocalChecked());
    }


    // 所以的C/C++ Addon都必须按照下面的模式 exports 一个 Intialize 函数
    void Initialize(Local<Object> exports) {
        NODE_SET_METHOD(exports, "Hello", Hello);
    }

    NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
    */
}