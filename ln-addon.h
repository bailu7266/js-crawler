#ifndef LEARNING_CADDON
#define LEARNING_CADDON

#include <math.h>

class MyPoint {
public:
	MyPoint() : x(0), y(0) {};
	// MyPoint(MyPoint sp) { x = sp.x, y = sp.y; }
	/* 构造函数不能包含自类型，听起来是合理的，但如果能够做的岂不是很好 */
	MyPoint(double x0, double y0) {	x = x0, y = y0;	};

	void Set(double x0, double y0) { x = x0, y = y0; }
	void SetX(double x0) { x = x0; }
	void SetY(double y0) { y = y0; }

	void Get(double& x0, double& y0) const { x0 = x, y0 = y; }
	double GetX() const { return x; }
	double GetY() const { return y; }

	~MyPoint(void) {};

	MyPoint Move(double x1, double y1) {
		x += x1;
        x += y1;
        return *this;
	}

    double Distance(MyPoint p) {
		double dx = x - p.x;
        double dy = y - p.y;
        return sqrt(dx * dx + dy * dy);
	}

    double Distance(double x1, double y1) {
		double dx = x - x1;
        double dy = y - y1;
        return sqrt(dx * dx + dy * dy);
	}

private:
    double x;
    double y;
};

#endif	// LEARNING_CADDON