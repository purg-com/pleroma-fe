import { brightness } from 'chromatism'
import { alphaBlend, mixrgb } from '../color_convert/color_convert.js'
/* This is a definition of all layer combinations
 * each key is a topmost layer, each value represents layer underneath
 * this is essentially a simplified tree
 */
export const LAYERS = {
  undelay: null, // root
  topBar: null, // no transparency support
  badge: null, //  no transparency support
  fg: null,
  bg: 'underlay',
  highlight: 'bg',
  panel: 'bg',
  popover: 'bg',
  selectedMenu: 'popover',
  btn: 'bg',
  btnPanel: 'panel',
  btnTopBar: 'topBar',
  input: 'bg',
  inputPanel: 'panel',
  inputTopBar: 'topBar',
  alert: 'bg',
  alertPanel: 'panel',
  poll: 'bg'
}

/* By default opacity slots have 1 as default opacity
 * this allows redefining it to something else
 */
export const DEFAULT_OPACITY = {
  alert: 0.5,
  input: 0.5,
  faint: 0.5,
  underlay: 0.15
}

/**  SUBJECT TO CHANGE IN THE FUTURE, this is all beta
 * Color and opacity slots definitions. Each key represents a slot.
 *
 * Short-hands:
 * String beginning with `--` - value after dashes treated as sole
 *     dependency - i.e. `--value` equivalent to { depends: ['value']}
 * String beginning with `#` - value would be treated as solid color
 *     defined in hexadecimal representation (i.e. #FFFFFF) and will be
 *     used as default. `#FFFFFF` is equivalent to { default: '#FFFFFF'}
 *
 * Full definition:
 * @property {String[]} depends - color slot names this color depends ones.
 *   cyclic dependencies are supported to some extent but not recommended.
 * @property {String} [opacity] - opacity slot used by this color slot.
 *   opacity is inherited from parents. To break inheritance graph use null
 * @property {Number} [priority] - EXPERIMENTAL. used to pre-sort slots so
 *   that slots with higher priority come earlier
 * @property {Function(mod, ...colors)} [color] - function that will be
 *   used to determine the color. By default it just copies first color in
 *   dependency list.
 * @argument {Number} mod - `1` (light-on-dark) or `-1` (dark-on-light)
 *   depending on background color (for textColor)/given color.
 * @argument {...Object} deps - each argument after mod represents each
 *   color from `depends` array. All colors take user customizations into
 *   account and represented by { r, g, b } objects.
 * @returns {Object} resulting color, should be in { r, g, b } form
 *
 * @property {Boolean|String} [textColor] - true to mark color slot as text
 *   color. This enables automatic text color generation for the slot. Use
 *   'preserve' string if you don't want text color to fall back to
 *   black/white. Use 'bw' to only ever use black or white. This also makes
 *   following properties required:
 * @property {String} [layer] - which layer the text sit on top on - used
 *   to account for transparency in text color calculation
 *   layer is inherited from parents. To break inheritance graph use null
 * @property {String} [variant] - which color slot is background (same as
 *   above, used to account for transparency)
 */
export const SLOT_INHERITANCE = {
  bg: {
    depends: [],
    opacity: 'bg',
    priority: 1
  },
  fg: {
    depends: [],
    priority: 1
  },
  text: {
    depends: [],
    priority: 1
  },
  underlay: {
    default: '#000000',
    opacity: 'underlay'
  },
  link: {
    depends: ['accent'],
    priority: 1
  },
  accent: {
    depends: ['link'],
    priority: 1
  },
  faint: {
    depends: ['text'],
    opacity: 'faint'
  },
  faintLink: {
    depends: ['link'],
    opacity: 'faint'
  },

  cBlue: '#0000ff',
  cRed: '#FF0000',
  cGreen: '#00FF00',
  cOrange: '#E3FF00',

  highlight: {
    depends: ['bg'],
    color: (mod, bg) => brightness(5 * mod, bg).rgb
  },
  highlightFaintText: {
    depends: ['faint'],
    layer: 'highlight',
    textColor: true
  },
  highlightFaintLink: {
    depends: ['faintLink'],
    layer: 'highlight',
    textColor: 'preserve'
  },
  highlightText: {
    depends: ['text'],
    layer: 'highlight',
    textColor: true
  },
  highlightLink: {
    depends: ['link'],
    layer: 'highlight',
    textColor: 'preserve'
  },
  highlightIcon: {
    depends: ['highlight', 'highlightText'],
    color: (mod, bg, text) => mixrgb(bg, text)
  },

  popover: {
    depends: ['bg'],
    opacity: 'popover'
  },
  popoverFaintText: {
    depends: ['faint'],
    layer: 'popover',
    textColor: true
  },
  popoverFaintLink: {
    depends: ['faintLink'],
    layer: 'popover',
    textColor: 'preserve'
  },
  popoverText: {
    depends: ['text'],
    layer: 'popover',
    textColor: true
  },
  popoverLink: {
    depends: ['link'],
    layer: 'popover',
    textColor: 'preserve'
  },
  popoverIcon: {
    depends: ['popover', 'popoverText'],
    color: (mod, bg, text) => mixrgb(bg, text)
  },

  selectedPost: '--highlight',
  selectedPostFaintText: {
    depends: ['highlightFaintText'],
    layer: 'highlight',
    variant: 'selectedPost',
    textColor: true
  },
  selectedPostFaintLink: {
    depends: ['highlightFaintLink'],
    layer: 'highlight',
    variant: 'selectedPost',
    textColor: 'preserve'
  },
  selectedPostText: {
    depends: ['highlightText'],
    layer: 'highlight',
    variant: 'selectedPost',
    textColor: true
  },
  selectedPostLink: {
    depends: ['highlightLink'],
    layer: 'highlight',
    variant: 'selectedPost',
    textColor: 'preserve'
  },
  selectedPostIcon: {
    depends: ['selectedPost', 'selectedPostText'],
    color: (mod, bg, text) => mixrgb(bg, text)
  },

  selectedMenu: {
    depends: ['popover'],
    color: (mod, bg) => brightness(5 * mod, bg).rgb
  },
  selectedMenuFaintText: {
    depends: ['highlightFaintText'],
    layer: 'selectedMenu',
    variant: 'selectedMenu',
    textColor: true
  },
  selectedMenuFaintLink: {
    depends: ['highlightFaintLink'],
    layer: 'selectedMenu',
    variant: 'selectedMenu',
    textColor: 'preserve'
  },
  selectedMenuText: {
    depends: ['highlightText'],
    layer: 'selectedMenu',
    variant: 'selectedMenu',
    textColor: true
  },
  selectedMenuLink: {
    depends: ['highlightLink'],
    layer: 'selectedMenu',
    variant: 'selectedMenu',
    textColor: 'preserve'
  },
  selectedMenuIcon: {
    depends: ['selectedMenu', 'selectedMenuText'],
    color: (mod, bg, text) => mixrgb(bg, text)
  },

  lightText: {
    depends: ['text'],
    color: (mod, text) => brightness(20 * mod, text).rgb
  },

  border: {
    depends: ['fg'],
    opacity: 'border',
    color: (mod, fg) => brightness(2 * mod, fg).rgb
  },

  poll: {
    depends: ['accent', 'bg'],
    copacity: 'poll',
    color: (mod, accent, bg) => alphaBlend(accent, 0.4, bg)
  },
  pollText: {
    depends: ['text'],
    layer: 'poll',
    textColor: true
  },

  icon: {
    depends: ['bg', 'text'],
    inheritsOpacity: false,
    color: (mod, bg, text) => mixrgb(bg, text)
  },

  // Foreground
  fgText: {
    depends: ['text'],
    layer: 'fg',
    textColor: true
  },
  fgLink: {
    depends: ['link'],
    layer: 'fg',
    textColor: 'preserve'
  },

  // Panel header
  panel: {
    depends: ['fg'],
    opacity: 'panel'
  },
  panelText: {
    depends: ['text'],
    layer: 'panel',
    textColor: true
  },
  panelFaint: {
    depends: ['fgText'],
    layer: 'panel',
    opacity: 'faint',
    textColor: true
  },
  panelLink: {
    depends: ['fgLink'],
    layer: 'panel',
    textColor: 'preserve'
  },

  // Top bar
  topBar: '--fg',
  topBarText: {
    depends: ['fgText'],
    layer: 'topBar',
    textColor: true
  },
  topBarLink: {
    depends: ['fgLink'],
    layer: 'topBar',
    textColor: 'preserve'
  },

  // Tabs
  tab: {
    depends: ['btn']
  },
  tabText: {
    depends: ['btnText'],
    layer: 'btn',
    textColor: true
  },
  tabActiveText: {
    depends: ['text'],
    layer: 'bg',
    textColor: true
  },

  // Buttons
  btn: {
    depends: ['fg'],
    opacity: 'btn'
  },
  btnText: {
    depends: ['fgText'],
    layer: 'btn',
    textColor: true
  },
  btnPanelText: {
    depends: ['panelText'],
    layer: 'btnPanel',
    variant: 'btn',
    textColor: true
  },
  btnTopBarText: {
    depends: ['topBarText'],
    layer: 'btnTopBar',
    variant: 'btn',
    textColor: true
  },

  // Buttons: pressed
  btnPressed: '--btn',
  btnPressedText: {
    depends: ['btnText'],
    layer: 'btn',
    variant: 'btnPressed',
    textColor: true
  },
  btnPressedPanel: {
    depends: ['btnPressed']
  },
  btnPressedPanelText: {
    depends: ['btnPanelText'],
    layer: 'btnPanel',
    variant: 'btnPressed',
    textColor: true
  },
  btnPressedTopBarText: {
    depends: ['btnTopBarText'],
    layer: 'btnTopBar',
    variant: 'btnPressed',
    textColor: true
  },

  // Buttons: toggled
  btnToggled: {
    depends: ['btn'],
    color: (mod, btn) => brightness(mod * 20, btn).rgb
  },
  btnToggledText: {
    depends: ['btnText'],
    layer: 'btn',
    variant: 'btnToggled',
    textColor: true
  },
  btnToggledPanelText: {
    depends: ['btnPanelText'],
    layer: 'btnPanel',
    variant: 'btnToggled',
    textColor: true
  },
  btnToggledTopBarText: {
    depends: ['btnTopBarText'],
    layer: 'btnTopBar',
    variant: 'btnToggled',
    textColor: true
  },

  // Buttons: disabled
  btnDisabled: {
    depends: ['btn', 'bg'],
    color: (mod, btn, bg) => alphaBlend(btn, 0.5, bg)
  },
  btnDisabledText: {
    depends: ['btnText'],
    layer: 'btn',
    variant: 'btnDisabled',
    textColor: true,
    color: (mod, text) => brightness(mod * -60, text).rgb
  },
  btnDisabledPanelText: {
    depends: ['btnPanelText'],
    layer: 'btnPanel',
    variant: 'btnDisabled',
    textColor: true,
    color: (mod, text) => brightness(mod * -60, text).rgb
  },
  btnDisabledTopBarText: {
    depends: ['btnTopBarText'],
    layer: 'btnTopBar',
    variant: 'btnDisabled',
    textColor: true,
    color: (mod, text) => brightness(mod * -60, text).rgb
  },

  // Input fields
  input: {
    depends: ['fg'],
    opacity: 'input'
  },
  inputText: {
    depends: ['text'],
    layer: 'input',
    textColor: true
  },
  inputPanelText: {
    depends: ['panelText'],
    layer: 'inputPanel',
    variant: 'input',
    textColor: true
  },
  inputTopbarText: {
    depends: ['topBarText'],
    layer: 'inputTopBar',
    variant: 'input',
    textColor: true
  },

  alertError: {
    depends: ['cRed'],
    opacity: 'alert'
  },
  alertErrorText: {
    depends: ['text'],
    layer: 'alert',
    variant: 'alertError',
    textColor: true
  },
  alertErrorPanelText: {
    depends: ['panelText'],
    layer: 'alertPanel',
    variant: 'alertError',
    textColor: true
  },

  alertWarning: {
    depends: ['cOrange'],
    opacity: 'alert'
  },
  alertWarningText: {
    depends: ['text'],
    layer: 'alert',
    variant: 'alertWarning',
    textColor: true
  },
  alertWarningPanelText: {
    depends: ['panelText'],
    layer: 'alertPanel',
    variant: 'alertWarning',
    textColor: true
  },

  badgeNotification: '--cRed',
  badgeNotificationText: {
    depends: ['text', 'badgeNotification'],
    layer: 'badge',
    variant: 'badgeNotification',
    textColor: 'bw'
  }
}
