from elasticsearch import Elasticsearch
from config import ConfigManager
    
def main():
    config = ConfigManager()

    es = Elasticsearch([config.get_address()])

    es.indices.create('library_index', body = {
        "settings": {
            "number_of_shards": 1
        },
        "mappings": {
            "properties": {
                "content": {
                    "type": "text",
                    "index_options": "offsets"
                }
            }
        }
    })

    print("Index created successfully.")

if __name__ == '__main__':
    main()
