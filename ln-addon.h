#ifndef LEARNING_CADDON
#define LEARNING_CADDON

typedef struct {
    int32_t id;
    char descr[64];
} MODULE_SPECIFIC;

class TestClass {
    public:
        TestClass();
        ~TestClass();

        static void napi_Test_Class();

        uint32_t id;
        char name[32];
};

#endif