# coding=utf-8
from __future__ import absolute_import

# ## This plugin will provide laser and CNC controls for the snapmaker printer / laser / cnc machine
import sys
import octoprint.plugin
from octoprint.settings import settings
from octoprint_snapmaker_control.constants import TOOL_CONTROLS, NORMAL_CHILDREN, CNC_CHILDREN, LASER_CHILDREN, SECTION_NAME


class SnapmakerControlPlugin(octoprint.plugin.SettingsPlugin,
                             octoprint.plugin.StartupPlugin,
                             octoprint.plugin.EventHandlerPlugin,
                             octoprint.plugin.AssetPlugin,
                             octoprint.plugin.TemplatePlugin):

    def get_assets(self):
        return dict(
			js=["js/snapmaker_control.js"],
			css=["css/snapmaker_control.css"],
			less=["less/snapmaker_control.less"]
		)

    def get_update_information(self):
        return dict(
			snapmaker_control=dict(
				displayName="Snapmaker_control Plugin",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="ron-linkertech",
				repo="octoprint-snapmaker-control",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/ron-linkertech/octoprint-snapmaker-control/archive/{target_version}.zip"
			)
		)

    def init(self):
        self.tools = TOOL_CONTROLS
        self.tools[0]["children"] = NORMAL_CHILDREN

    def on_event(self, event, payload):
        # FileSelected - path, origin (local == ok to do boundry)
        # MetadataAnalysisFinished path,origin, result-> printingArea (maxZ, etc (min/max)(X/Y/Z))
        # Connected
        # Disconnected
        method = getattr(self, 'on_event_' + event, None)
        if method is not None:
            self._logger.info('Handle event {} {}'.format(event, payload))
            method(payload)
        else:
            self._logger.info(
                'Did not handle event {} {}'.format(event, payload))

    def on_event_Connected(self, params):
        self._logger.info('Connected!!!!!!')
        self.set_tool_status()

    def set_tool_status(self):
        """
        Send M105, and get response.
          If it has B0 and T300-499.99 then activate laser
          If it has B0 and T500+ then activate CNC
          else activate "normal"
        """
        TOOL_CONTROLS[0]["children"] = NORMAL_CHILDREN
        TOOL_CONTROLS[0]["children"] = CNC_CHILDREN
        TOOL_CONTROLS[0]["children"] = LASER_CHILDREN
        self.save_settings(TOOL_CONTROLS)

    def on_event_FileSelected(self, params):
        self._logger.debug('File selected!!!!!!')

    def on_event_MetadataAnalysisFinished(self, params):
        self._logger.debug('File analized  !!!!')

    def on_event_Disconnected(self, params):
        self._logger.debug('Disconnected!!!!!!')
        self.set_tool_status()

    def get_settings_defaults(self):
        self._logger.info("get_settings_default")
        TOOL_CONTROLS[0]["children"] = NORMAL_CHILDREN
        self._logger.info('Get default {}'.format(TOOL_CONTROLS))
        default_settings = {"controls": TOOL_CONTROLS}
        return default_settings

    def on_settings_save(self, data):
        self._logger.info('saving settings')
        s = settings()
        s.set(["controls"], data["controls"])

    def on_after_startup(self):
        self._logger.info("after startup. Adding to controls")
        self.save_settings(self.get_settings_defaults()["controls"])

    def save_settings(self, my_controls):
        s = settings()
        controls = []
        try:
            controls = s.get(["controls"])
        except:
            self._logger.info('Error {}'.format(sys.exc_info()[0]))
        # delete my old controls
        for ix, item in enumerate(controls):
            if item['name'] == SECTION_NAME:
                del controls[ix]
        # add my new controls
        self._logger.info('                    {}'.format(my_controls))
        s.set(["controls"], my_controls + controls)
        s.save()


# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Snapmaker Control"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = SnapmakerControlPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
