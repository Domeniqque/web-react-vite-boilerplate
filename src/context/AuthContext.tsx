import { AxiosError } from 'axios';
import React, { memo, useCallback, useContext, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSWRConfig } from 'swr';
import { AccountApi, LoginProps, User } from '~/api/account';
import { setAuthTokens } from '~/config/client';
import { getAccessToken } from '~/config/client/utils';

export type AuthContextData = {
  user?: User;
  isSigned: boolean;
  isSignIn: boolean;
  isFetchingProfile: boolean;
  login(data: LoginProps): Promise<void>;
};

export const AuthContext = React.createContext({} as AuthContextData);

type Props = {
  children: React.ReactNode;
};

export const AuthProvider = memo(({ children }: Props) => {
  const [isFetchingProfile, setFetchingProfile] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [userData, setUserData] = useState<User>();
  const { mutate } = useSWRConfig();

  const isSigned = !!userData;

  const shouldFetchUserOnStart = useRef(!!getAccessToken() && !userData);

  React.useEffect(() => {
    if (shouldFetchUserOnStart.current) {
      async function loadProfile() {
        try {
          setFetchingProfile(true);
          const profile = await AccountApi.profile();
          setUserData(profile);
          mutate(AccountApi.profileUrl, profile);
        } finally {
          setFetchingProfile(false);
          shouldFetchUserOnStart.current = false;
        }
      }

      loadProfile();
    }

    shouldFetchUserOnStart.current = false;
  }, []);

  const login = useCallback(async ({ email, password }: LoginProps) => {
    setIsSignIn(true);

    try {
      const tokens = await AccountApi.login({ email, password });

      setAuthTokens(tokens);

      const profile = await AccountApi.profile();
      setUserData(profile);
      mutate(AccountApi.profileUrl, profile);
    } catch (err) {
      if (err instanceof AxiosError && err.status === 500) {
        toast.error('Something went wrong! Try again.');
      }
      throw err;
    } finally {
      setIsSignIn(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user: userData,
      login,
      isSigned,
      isSignIn,
      isFetchingProfile,
    }),
    [userData, isSigned, login, isSignIn, isFetchingProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
});

export const useAuth = () => {
  const context = useContext(AuthContext);

  return context;
};
