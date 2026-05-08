// ANSI color codes used as the "accent" tint for each logo.
// Logos are stored as plain text lines; the accent is applied at render time
// so each logo can ship in a single visual color without inlined escapes.
const C = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
  orange: "\x1b[38;5;208m",
  purple: "\x1b[38;5;141m",
};

export interface AsciiLogo {
  id: string;
  name: string;
  accent: string;
  lines: string[];
}

const HYPRSTART = `\
        ▟▙
      ▟████▙
    ▟████████▙
  ▟████  ██████▙
 ████  ▟██  █████
 ████  ▜██  █████
  ▜████  ██████▛
    ▜████████▛
      ▜████▛
        ▜▛`;

const ARCH = `\
                   -\`
                  .o+\`
                 \`ooo/
                \`+oooo:
               \`+oooooo:
               -+oooooo+:
             \`/:-:++oooo+:
            \`/++++/+++++++:
           \`/++++++++++++++:
          \`/+++ooooooooooooo/\`
         ./ooosssso++osssssso+\`
        .oossssso-\`\`\`\`/ossssss+\`
       -osssssso.      :ssssssso.
      :osssssss/        osssso+++.
     /ossssssss/        +ssssooo/-
   \`/ossssso+/:-        -:/+osssso+-
  \`+sso+:-\`                 \`.-/+oso:
 \`++:.                           \`-/+/
 .\`                                 \`/`;

const NIXOS = `\
          ::::.    ':::::     ::::'
          ':::::    ':::::.  ::::'
            :::::     '::::.:::::
      .......:::::..:::::::::
     ::::::::::::::::::. ::::::    ::::.
    ::::::::::::::::::::: :::::.  .::::'
           .....           ::::' :::::'
          :::::            '::' :::::'
 ........:::::               ' :::::::::::.
:::::::::::::                 :::::::::::::
 ::::::::::: ..              :::::
     .::::: .:::            :::::
    .:::::  :::::          '''''    .....
    :::::   ':::::.  ......:::::::::::::'
     :::     ::::::. ':::::::::::::::::'
            .:::::::: '::::::::::
           .::::''::::.     '::::.
          .::::'   ::::.     '::::.
         .::::      ::::      '::::.`;

const DEBIAN = `\
       _,met$$$$$gg.
    ,g$$$$$$$$$$$$$$$P.
  ,g$$P"     """Y$$.".
 ,$$P'              \`$$$.
',$$P       ,ggs.     \`$$b:
\`d$$'     ,$P"'   .    $$$
 $$P      d$'     ,    $$P
 $$:      $$.   -    ,d$$'
 $$;      Y$b._   _,d$P'
 Y$$.    \`.\`"Y$$$$P"'
 \`$$b      "-.__
  \`Y$$
   \`Y$$.
     \`$$b.
       \`"Y$$b.
          \`-.__`;

const UBUNTU = `\
            .-/+oossssoo+/-.
        \`:+ssssssssssssssssss+:\`
      -+ssssssssssssssssssyyssss+-
    .ossssssssssssssssssdMMMNysssso.
   /ssssssssssshdmmNNmmyNMMMMhssssss/
  +ssssssssshmydMMMMMMMNddddyssssssss+
 /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
ossyNMMMNyMMhsssssssssssssshmmmhssssssso
+sssshhhyNMMNyssssssssssssyNMMMysssssss+
.ssssssssdMMMNhsssssssssshNMMMdssssssss.
 /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/
  +sssssssssdmydMMMMMMMMddddyssssssss+
   /ssssssssssshdmNNNNmyNMMMMhssssss/
    .ossssssssssssssssssdMMMNysssso.
      -+sssssssssssssssssyyyssss+-
        \`:+ssssssssssssssssss+:\`
            .-/+oossssoo+/-.`;

const FEDORA = `\
             .',;::::;,'.
         .';:cccccccccccc:;,.
      .;cccccccccccccccccccccc;.
    .:cccccccccccccccccccccccccc:.
  .;ccccccccccccc;.:dddl:.;ccccccc;.
 .:ccccccccccccc;OWMKOOXMWd;ccccccc:.
.:ccccccccccccc;KMMc;cc;xMMc:ccccccc:.
,cccccccccccccc;MMM.;cc;;WW::cccccccc,
:cccccccccccccc;MMM.;cccccccccccccccc:
:ccccccc;oxOOOo;MMM0OOk.;cccccccccccc:
cccccc:0MMKxdd:;MMMkddc.;cccccccccccc;
ccccc:XMC';cc;;MMM.;cccccccccccccccc'
ccccc;MMo;ccc;;MMW.;ccccccccccccccc;
ccccc;0MNc.ccc.xMMd:ccccccccccccccc;
cccccc;dNMWXXXWM0::cccccccccccccc:,
cccccccc;.:odl:.;cccccccccccccc:,.
:cccccccccccccccccccccccccccc:'.
.:cccccccccccccccccccccc:;,..
  '::cccccccccccccc::;,.`;

const MACOS = `\
                    'c.
                 ,xNMM.
               .OMMMMo
               OMMM0,
     .;loddo:' loolloddol;.
   cKMMMMMMMMMMNWMMMMMMMMMM0:
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.
 XMMMMMMMMMMMMMMMMMMMMMMMX.
;MMMMMMMMMMMMMMMMMMMMMMMM:
:MMMMMMMMMMMMMMMMMMMMMMMM:
.MMMMMMMMMMMMMMMMMMMMMMMMX.
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMMMMMK.
    kMMMMMMMMMMMMMMMMMMMMMMd
     ;KMMMMMMMWXXWMMMMMMMk.
       .cooc,.    .,coo:.`;

const WINDOWS = `\
        ,.=:!!t3Z3z.,
       :tt:::tt333EE3
       Et:::ztt33EEEL @Ee.,      ..,
      ;tt:::tt333EE7 ;EEEEEEttttt33#
     :Et:::zt333EEQ. SEEEEEttttt33QL
     it::::tt333EEF @EEEEEEttttt33F
    ;3=*^\`\`\`'*4EEV :EEEEEEttttt33@.
    ,.=::::!t=., \` @EEEEEEtttz33QF
   ;::::::::zt33)   '4EEEtttji3P*
  :t::::::::tt33.:Z3z..  \`\` ,..g.
  i::::::::zt33F AEEEtttt::::ztF
 ;:::::::::t33V ;EEEttttt::::t3
 E::::::::zt33L @EEEtttt::::z3F
{3=*^\`\`\`'*4E3) ;EEEtttt:::::tZ\`
            \` :EEEEtttt::::z7
                'VEzjt:;;z>*\``;

const TUX = `\
         _nnnn_
        dGGGGMMb
       @p~qp~~qMb
       M|@||@) M|
       @,----.JM|
      JS^\\__/  qKL
     dZP        qKRb
    dZP          qKKb
   fZP            SMMb
   HZM            MMMM
   FqM            MMMM
 __| ".        |\\dS"qML
 |    \`.       | \`' \\Zq
_)      \\.___.,|     .'
\\____   )MMMMMP|   .'
     \`-'       \`--'`;

const HYPRLAND = `\
                .';:;,
              ';;;;;;;;'
       .,'  .;;;;;;;;;.
      ;;;,. ,;;;;;;;;
       ;;;;;;;;;;;;;.        ',;;;;,
        ;;;;;;;;;;.        ',;;;;;;;
   .,;;;.  ;;;;;'         ;;;;;;;;;;
  ,;;;;;;,. ;;;'         ;;;;;;;;;;'
 ,;;;;;;;;;;;;          ;;;;;;;;;;
 ';;;;;;;;;;;;        ;;;;;;;;;;.
   ';;;;;;;;'       ;;;;;;;;;;,
                  ,;;;;;;;;;;'
                ',;;;;;;;;;;
                ;;;;;;;;;;'
              ';;;;;;;;'`;

export const LOGOS: AsciiLogo[] = [
  {
    id: "hyprstart",
    name: "hyprstart",
    accent: C.brightCyan,
    lines: HYPRSTART.split("\n"),
  },
  {
    id: "hyprland",
    name: "Hyprland",
    accent: C.brightCyan,
    lines: HYPRLAND.split("\n"),
  },
  {
    id: "arch",
    name: "Arch Linux",
    accent: C.cyan,
    lines: ARCH.split("\n"),
  },
  {
    id: "nixos",
    name: "NixOS",
    accent: C.brightBlue,
    lines: NIXOS.split("\n"),
  },
  {
    id: "debian",
    name: "Debian",
    accent: C.red,
    lines: DEBIAN.split("\n"),
  },
  {
    id: "ubuntu",
    name: "Ubuntu",
    accent: C.orange,
    lines: UBUNTU.split("\n"),
  },
  {
    id: "fedora",
    name: "Fedora",
    accent: C.blue,
    lines: FEDORA.split("\n"),
  },
  {
    id: "macos",
    name: "macOS",
    accent: C.gray,
    lines: MACOS.split("\n"),
  },
  {
    id: "windows",
    name: "Windows",
    accent: C.brightCyan,
    lines: WINDOWS.split("\n"),
  },
  {
    id: "tux",
    name: "Tux",
    accent: C.brightYellow,
    lines: TUX.split("\n"),
  },
];

export const DEFAULT_LOGO_ID = "hyprstart";
