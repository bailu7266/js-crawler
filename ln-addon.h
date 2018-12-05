#ifndef LEARNING_CADDON
#define LEARNING_CADDON

#include <math.h>

class MyPoint {
public:
	MyPoint() : x(0), y(0) {};
	MyPoint(double x0, double y0) {
		x = x0, y = y0;
	};

	void Set(double x0, double y0) {
		x = x0, y = y0;
	}

	void Get(double& x0, double& y0) const {
		x0 = x;
		y0 = y;
	}

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