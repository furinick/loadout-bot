private _out = "{";
{
    private _cfg = _x;
    private _mass = getNumber (_cfg >> "mass");
    if (_mass == 0 && {isClass (_cfg >> "itemInfo")}) then { _mass = getNumber (_cfg >> "itemInfo" >> "mass"); };
    if (_mass == 0 && {isClass (_cfg >> "WeaponSlotsInfo")}) then { _mass = getNumber (_cfg >> "WeaponSlotsInfo" >> "mass"); };
    if (_mass > 0) then { _out = _out + """" + (configName _cfg) + """:" + str _mass + ","; };
} forEach ("true" configClasses (configFile >> "CfgWeapons"));

_out = ((_out select [0, (count _out) - 1]) + "}");
copyToClipboard _out;
hint "Done!";
