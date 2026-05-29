import { useSignIn } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComicHeader } from '@/components/AuthHeader';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  ink:      '#0A0806',
  inkMid:   '#14100A',
  inkLight: '#1E1810',
  gold:     '#FFD600',
  goldMid:  '#FF9500',
  goldDim:  '#C4913A',
  bg:       '#F8F4EE',
  card:     '#FFFFFF',
  formBorder: '#E5DDD3',
  fg:       '#1A1A1A',
  muted:    '#8A7E74',
  primary:  '#2D4A3E',
  error:    '#DC2626',
};

// ── Gradient CTA Button ───────────────────────────────────────────────────────
function ComicButton({
  label,
  onPress,
  loading,
  disabled,
  icon = 'zap',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[s.comicBtnWrap, disabled && { opacity: 0.4 }]}
    >
      <LinearGradient
        colors={disabled ? ['#888', '#666'] : [C.gold, C.goldMid]}
        style={s.comicBtnGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <>
            <Feather name={icon} size={16} color="#000" />
            <Text style={s.comicBtnText}>{label}</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function SignInScreen() {
  // Core v3 API: { signIn, errors, fetchStatus } — no isLoaded / setActive
  const { signIn, errors, fetchStatus } = useSignIn();
  const insets = useSafeAreaInsets();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode]                 = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = fetchStatus === 'fetching';

  // Navigate into the app after sign-in is finalised
  const navigateToApp = () => router.replace('/(tabs)' as any);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setErrorMessage(null);

    // Core v3: signIn.password() — returns { error }
    const { error } = await signIn.password({
      emailAddress: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMessage(error.message ?? 'Sign in failed. Check your email and password.');
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          navigateToApp();
        },
      });
    } else if (signIn.status === 'needs_client_trust') {
      // MFA — send email code and show verification input
      await signIn.mfa.sendEmailCode();
    } else {
      setErrorMessage('Sign in could not be completed. Please try again.');
    }
  };

  const handleVerifyMFA = async () => {
    if (!code.trim()) return;
    setErrorMessage(null);

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          navigateToApp();
        },
      });
    } else {
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  // ── MFA verification view ─────────────────────────────────────────────────
  if (signIn.status === 'needs_client_trust') {
    return (
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ paddingTop: insets.top }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ComicHeader title="Verify Your Account" subtitle="Enter the code we sent to your email." />

          <View style={s.formZone}>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Verification code</Text>
              <TextInput
                style={[s.input, s.codeInput]}
                value={code}
                onChangeText={v => { setCode(v); setErrorMessage(null); }}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={C.muted}
                maxLength={6}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleVerifyMFA}
              />
            </View>

            {errors.fields.code && (
              <View style={s.errorRow}>
                <Feather name="alert-circle" size={14} color={C.error} />
                <Text style={s.errorText}>{errors.fields.code.message}</Text>
              </View>
            )}
            {errorMessage ? (
              <View style={s.errorRow}>
                <Feather name="alert-circle" size={14} color={C.error} />
                <Text style={s.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <ComicButton
              label="VERIFY"
              onPress={handleVerifyMFA}
              loading={isLoading}
              disabled={!code}
              icon="shield"
            />

            <TouchableOpacity
              style={s.ghostBtn}
              onPress={() => signIn.mfa.sendEmailCode()}
              disabled={isLoading}
            >
              <Text style={s.ghostBtnText}>Resend code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.ghostBtn}
              onPress={() => signIn.reset()}
            >
              <Text style={s.ghostBtnText}>← Start over</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Main sign-in form ─────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ComicHeader title="Welcome Back" subtitle="Continue your story where you left off." />

        <View style={s.formZone}>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={v => { setEmail(v); setErrorMessage(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              returnKeyType="next"
            />
            {errors.fields.identifier && (
              <Text style={s.fieldError}>{errors.fields.identifier.message}</Text>
            )}
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Password</Text>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.input, s.passwordInput]}
                value={password}
                onChangeText={v => { setPassword(v); setErrorMessage(null); }}
                secureTextEntry={!showPassword}
                placeholder="Your password"
                placeholderTextColor={C.muted}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            {errors.fields.password && (
              <Text style={s.fieldError}>{errors.fields.password.message}</Text>
            )}
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={s.forgotBtn}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          {errorMessage ? (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={14} color={C.error} />
              <Text style={s.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ComicButton
            label="SIGN IN"
            onPress={handleSignIn}
            loading={isLoading}
            disabled={!email || !password}
            icon="log-in"
          />

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>NEW CREATOR?</Text>
            <View style={s.dividerLine} />
          </View>

          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity style={s.switchBtn} activeOpacity={0.7}>
              <Text style={s.switchText}>Create an account</Text>
              <Feather name="arrow-right" size={14} color={C.goldDim} />
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  formZone: { paddingHorizontal: 22, paddingTop: 28, gap: 16 },

  comicBtnWrap: {
    borderRadius: 14, overflow: 'hidden', marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: C.gold, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45, shadowRadius: 18,
      },
      android: { elevation: 12 },
    }),
  },
  comicBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  comicBtnText: {
    fontSize: 15, fontFamily: 'Inter_700Bold',
    color: '#000', letterSpacing: 1.2,
  },

  fieldGroup:    { gap: 6 },
  label:         { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.fg },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.formBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: C.fg,
  },
  codeInput:     { textAlign: 'center', fontSize: 28, fontFamily: 'Inter_600SemiBold', letterSpacing: 8 },
  passwordRow:   { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingRight: 48 },
  eyeBtn:        { position: 'absolute', right: 16, height: '100%', justifyContent: 'center' },
  forgotBtn:     { alignSelf: 'flex-end', marginTop: -4 },
  forgotText:    { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.goldDim },
  fieldError:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.error, marginTop: 2 },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.error, flex: 1 },

  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.formBorder },
  dividerText: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5 },

  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  switchText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.goldDim },

  ghostBtn:     { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.muted },
});
