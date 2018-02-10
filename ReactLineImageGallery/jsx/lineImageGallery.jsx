/*** @jsx React.DOM */

var LineImageGallery = (function () {
  var _isInit = false;
  var _hasScroll = false;

  function _getScrollbarWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    // needed for WinJS apps
    outer.style.msOverflowStyle = "scrollbar";
    document.body.appendChild(outer);
    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";
    // add inner div
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);
    var widthWithScroll = inner.offsetWidth;
    // remove divs
    outer.parentNode.removeChild(outer);
    return widthNoScroll - widthWithScroll;
  }

  var lineImageGalleryClass = React.createClass({
    _getAllLines: function _getAllLines() {
      // 全部行
      var allLines = [];
      // 單行
      var singleLine = [];
      // 累計長寬比
      var singleLineRateCounter = 0;
      // 累計行寬
      var lineImagesWidthCounter = 0;
      //容器寬度
      var width = this._getWidth();
      // 走訪 Images
      for (var i = 0; i < this.props.Images.length; i++) {
        var image = this.props.Images[i];
        // Rate = Width / Height
        var imageWidth = Math.round(this.props.Size * image.Rate);
        // 是否大於行寬 = 累計行寬 + 當前圖片寬度一半 <= 行寬
        var isGreaterThanWidth = Math.round(lineImagesWidthCounter + imageWidth / 2) > width;
        if (isGreaterThanWidth) {
          // 如果大於行寬 則斷行 運算行陣列
          var calculatedLine = this._calculateLine(singleLine, singleLineRateCounter);
          // 將運算後的陣列件加入 allLines
          allLines.push(calculatedLine);
          // 重置變數
          singleLine = [];
          singleLineRateCounter = 0;
          lineImagesWidthCounter = 0;
        }
        // 累計行寬
        lineImagesWidthCounter += imageWidth;
        // 累計長寬比
        singleLineRateCounter += image.Rate;
        // 將圖片加入 singleLine
        singleLine.push(image);
      };
      // 最後一行 剩餘圖片
      if (singleLine.length > 0) {
        var lastLine = this._calculateLastLine(singleLine, singleLineRateCounter, lineImagesWidthCounter);
        allLines.push(lastLine);
      }
      return allLines;
    },
    _calculateLastLine: function _calculateLastLine(line, leLineRate, lineImagesWidth) {
      return this._calculateLine(line, leLineRate, true, lineImagesWidth);
    },
    _calculateLine: function _calculateLine(line, leLineRate, isLastLine, lastLineImagesWidth) {
      // 水平間距
      var spacing = (line.length - 1) * this.props.Margin;
      // 容器寬度
      var width = this._getWidth();
      // 單行所有圖片寬度和
      var lineImagesWidth = width - spacing;
      if (isLastLine) {
        lineImagesWidth = lastLineImagesWidth > lineImagesWidth ? lineImagesWidth : lastLineImagesWidth;
      }
      // 累計容器寬度
      var widthCounter = 0;
      var lines = line.map(function (image, index) {
        var isLastImage = index === line.length - 1;
        // 盒寬
        var boxWidth = Math.round(image.Rate / leLineRate * lineImagesWidth);
        // 處理四捨五入不整除 Firefox 跑版問題
        if (isLastImage && (widthCounter + boxWidth) !== lineImagesWidth) {
          boxWidth = lineImagesWidth - widthCounter;
        }
        widthCounter += boxWidth;
        // 盒右間距
        var boxMarginRight = isLastImage ? 0 : this.props.Margin;
        // 圖寬
        var imageWidth = Math.round(image.Rate * this.props.Size);
        // 圖高
        var imageHeight = this.props.Size;
        // 圖左間距
        var imageMarginLeft = 0;
        // 圖上間距
        var imageMarginTop = 0;
        // 處裡盒比圖寬的情形
        if (imageWidth < boxWidth) {
          // 將圖寬設為盒寬
          imageWidth = boxWidth;
          // 將圖高依盒寬等比例增加
          imageHeight = Math.round(boxWidth / image.Rate);
          // 設定上間距以垂直置中
          imageMarginTop = Math.round((this.props.Size - imageHeight) / 2);
        }
        // 處裡圖比盒寬的情形
        if (imageWidth > boxWidth) {
          imageMarginLeft = Math.round((boxWidth - imageWidth) / 2);
        }

        return {
          Src: image.Src,
          BoxStyle: {
            'height': this.props.Size,
            'width': boxWidth,
            'marginRight': boxMarginRight,
            'display': 'inline-block',
            'float': 'left',
            'overflow': 'hidden'
          },
          ImgStyle: {
            'height': imageHeight,
            'width': imageWidth,
            'marginLeft': imageMarginLeft,
            'marginTop': imageMarginTop
          }
        };
      }, this);

      return lines;
    },
    _getViewport: function _getViewport(argument) {
      var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight || e.clientHeight || g.clientHeight;
      return { x: x, y: y };
    },
    _getWidth: function _getWidth() {
      var viewport = this._getViewport();
      var scrollbarWidth = 0;
      if (_hasScroll) {
        scrollbarWidth = this.props.ScrollbarWidth;
      }
      return this.props.Width === 'auto' ? viewport.x - (this.props.Padding * 2) - scrollbarWidth : this.props.Width;
    },
    _checkScroll: function _checkScroll() {
      var viewport = this._getViewport();
      _hasScroll = this.refs.container.getDOMNode().scrollHeight > viewport.y;
    },
    getDefaultProps: function getDefaultProps() {
      var scrollbarWidth = _getScrollbarWidth();
      return {
        Images: [],
        Size: 200,
        Margin: 10,
        Padding: 20,
        ScrollbarWidth: scrollbarWidth,
        Width: 'auto'
      };
    },
    componentDidMount: function componentDidMount() {
      if (!_isInit) {
        _isInit = true;
        if (this.props.Width === 'auto') {
          window.onresize = function () {
            this._checkScroll();
            this.forceUpdate();
          }.bind(this);
          this._checkScroll();
          if (_hasScroll) {
            this.forceUpdate();
          }
        }
      }
    },
    render: function () {
      var width = this._getWidth();
      var allLines = this._getAllLines();

      return (
        <div className="line-image-gallery" style={{ width: width, padding: this.props.Padding }} ref="container">
          {allLines.map(function (line, lineKey) {
            return (
              <div className="line-image-gallery-line" style={{ height: this.props.Size, marginBottom: this.props.Margin }} key={lineKey}>

                {line.map(function (image, imageKey) {
                  return (
                    <div className="line-image-gallery-box" style={image.BoxStyle} key={imageKey}>
                      <img src={image.Src} style={image.ImgStyle} />
                    </div>
                  )
                }, this)}

                <div style={{ clear: 'both' }}></div>
              </div>
            )
          }, this)}
        </div>
      )
    }
  });

  return lineImageGalleryClass;
})();
