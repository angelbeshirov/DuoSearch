from elasticsearch import Elasticsearch
from config import ConfigManager

def main():
    config = ConfigManager()

    es = Elasticsearch([config.get_address()])
    es.indices.delete(index='library_index', ignore=[400])

    print("Index deleted successfully!")

if __name__ == '__main__':
    main()