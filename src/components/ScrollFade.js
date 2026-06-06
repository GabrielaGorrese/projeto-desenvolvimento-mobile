import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';


const ScrollFade = forwardRef(function ScrollFade({
  children,
  style,
  fadeColor = '#FFF',
  fadeHeight = 52,
  onScroll,
  ...rest
}, ref) {
  const [showFade, setShowFade] = useState(false);
  const viewH    = useRef(0);
  const contentH = useRef(0);

  function recheck() {
    setShowFade(contentH.current > viewH.current + 10);
  }

  function handleLayout(e) {
    viewH.current = e.nativeEvent.layout.height;
    recheck();
  }

  function handleContentSizeChange(_w, h) {
    contentH.current = h;
    recheck();
  }

  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 16;
    setShowFade(!atBottom);
    onScroll?.(e);
  }, [onScroll]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        {...rest}
        ref={ref}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator
      >
        {children}
      </ScrollView>

      {showFade ? (
        <View pointerEvents="none" style={[styles.fade, { height: fadeHeight }]}>
          {STOPS.map((opacity, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: fadeColor, opacity }} />
          ))}
        </View>
      ) : null}
    </View>
  );
});


const STOPS = [0, 0.07, 0.18, 0.38, 0.62, 0.82, 1];

export default ScrollFade;

const styles = StyleSheet.create({
  container: { flex: 1 },
  fade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
