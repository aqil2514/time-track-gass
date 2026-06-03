import { UserSettings } from "@/@types/auth";
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { KeyedMutator } from "swr";

interface TeamSettingContextType {
  userSetting: { settings: UserSettings; id: string };
  mutate: KeyedMutator<{ settings: UserSettings; id: string }>;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
}

const TeamSettingContext = createContext<TeamSettingContextType>(
  {} as TeamSettingContextType,
);

export function TeamSettingProvider({
  children,
  userSetting,
  mutate
}: {
  children: React.ReactNode;
  userSetting: { settings: UserSettings; id: string };
  mutate: KeyedMutator<{ settings: UserSettings; id: string }>;
}) {
  const [content, setContent] = useState("tracker");

  const values: TeamSettingContextType = {
    content,
    setContent,
    userSetting,
    mutate
  };

  return (
    <TeamSettingContext.Provider value={values}>
      {children}
    </TeamSettingContext.Provider>
  );
}

export const useUserSetting = () => useContext(TeamSettingContext);
