import regex as re
from config import ConfigManager

class TextProcessor:

    def __init__(self, config=ConfigManager()):
        self.clada_dictionary = set(line.strip() for line in open(config.get_clada_dictionary(), encoding='utf-16', mode="r"))

    def clear_metadata(self, file):
        """
        Clear up metadata.
        """
        file = re.sub('-[\s][0-9]+[\s]-[\s]*', '', file)
        file = re.sub('[Сс][ГгТт][Рр][\.\-,][\s]*[-]*([1-9][0-9]*)?[-]?([1-9][0-9]*)?[\.\-,]*', '', file)
        return re.sub('[\s]+', ' ', file)

    def correct_words_with_hyphens(self, text):
        regex = re.compile('\s+')
        words = regex.split(text)

        preprocessed_text = text
        for i, word in enumerate(words):
            if "-" in word and i < len(words) - 1:
                next_word = words[i + 1]

                semi_light_word = word + next_word
                merged_word = word.replace("-", "") + next_word

                original_seq = word + " " + next_word
                if semi_light_word in self.clada_dictionary:
                    preprocessed_text = re.sub(original_seq, semi_light_word, text)
                elif merged_word in self.clada_dictionary:
                    preprocessed_text = re.sub(original_seq, merged_word, text)

        return preprocessed_text

    def process(self, text):
        text = self.clear_metadata(text)
        text = self.correct_words_with_hyphens(text)

        return text