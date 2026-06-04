import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../theme';


export default function Screen({
  children,
  scroll        = false,
  background    = colors.bgScreen,
  statusBarStyle = 'dark-content',
  statusBarBg    = colors.bgDark,
  contentContainerStyle,
  keyboardOffset = 0,
  avoidKeyboard = true,
}) {
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [{ flexGrow: 1 }, contentContainerStyle],
      }
    : { style: [{ flex: 1 }, contentContainerStyle] };

  const content = <Container {...containerProps}>{children}</Container>;

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardOffset}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
