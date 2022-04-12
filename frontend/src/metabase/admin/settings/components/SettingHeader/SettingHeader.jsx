/* eslint-disable react/prop-types */
import React from "react";
import { jt } from "ttag";
import { SettingDescription, SettingTitle } from "./SettingHeader.styled";

const SettingHeader = ({ id, setting }) => {
  // Disable translation, because it's needed
  // only for whitelabel name replacement.
  // See metabase#17043
  /* disable ttag */
  return (
    <div>
      <SettingTitle htmlFor={id}>{setting.display_name}</SettingTitle>
      <SettingDescription>
        {setting.warningMessage && (
          <React.Fragment>
            <strong>{jt`${setting.warningMessage}`}</strong>{" "}
          </React.Fragment>
        )}
        {jt`${setting.description}`}
        {setting.note && <div>{jt`${setting.note}`}</div>}
      </SettingDescription>
    </div>
  );
};
export default SettingHeader;
