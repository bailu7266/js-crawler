module.exports = ($scope, tabs) => {
    $scope.TAB_ID = 0;
    $scope.TAB_LABEL = 1;
    $scope.TAB_CONTENT_ID = 2;
    $scope.TAB_ON_CLICK = 3;
    $scope.tabs = tabs;

    /*for (let i = 0; i < $scope.tabs.length; i++) {
        document
            .getElementById($scope.tabs[i][$scope.TAB_ID])
            .addEventListener(
                "click",
                $scope.tabs[i][$scope.TAB_ON_CLICK]
            );
    }*/
    $scope.setActive = () => {
        document
            .getElementById($scope.tabs[0][$scope.TAB_ID])
            .classList.add('active');
        document.getElementById(
            $scope.tabs[0][$scope.TAB_CONTENT_ID]
        ).style.display = 'block';
    };

    $scope.onClick = function (e) {
        let _this = e.target;
        if (!_this) {
            console.log('不明消息来源');
            return;
        }
        if (_this.classList.contains('.active')) return;

        let activeTab = _this.parentElement.querySelector(
            '.active'
        );
        if (activeTab) {
            activeTab.classList.remove('active');
            document.getElementById(
                $scope.tabs[
                    $scope.tabs.findIndex(elt => {
                        return elt[$scope.TAB_ID] == activeTab.id;
                    })
                ][$scope.TAB_CONTENT_ID]
            ).style.display = 'none';
        }
        _this.classList.add('active');
        document.getElementById(
            $scope.tabs[
                $scope.tabs.findIndex(elt => {
                    return elt[$scope.TAB_ID] == _this.id;
                })
            ][$scope.TAB_CONTENT_ID]
        ).style.display = 'block';
    };
};