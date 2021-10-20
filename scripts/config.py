import configparser
    
class ConfigManager:

    def __init__(self):
        self.config = configparser.ConfigParser()
        self.config.read('config.ini')

    def get_address(self):
        domain = self.config['ELASTIC']['DOMAIN']
        port = self.config['ELASTIC']['PORT']
        return domain + ':' + port

    def get_path(self):
        return self.config['DATA']['PATH']

    def get_clada_dictionary(self):
        return self.config['DATA']['DICTIONARY']