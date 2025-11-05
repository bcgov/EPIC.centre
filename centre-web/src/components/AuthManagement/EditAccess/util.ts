export const getAccessLevelWarningMessage = (groupPath: string) => {
  if (groupPath === "/ENGAGE/EAO_TEAM_MEMBER") {
    return "Warning: Changing access levels for EAO Team Members in Engage may affect their ability to perform essential tasks.";
  }

  if (groupPath === "/TRACK/VIEWER") {
    return "Warning: Changing access levels for Track Viewers may affect their ability to view certain content.";
  }

  return null;
};
