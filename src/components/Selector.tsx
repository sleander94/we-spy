import { SelectorProps } from '../types.d';

const Selector = ({ x, y, hiddenItems, handleGuess }: SelectorProps) => {
  return (
    <ol id="selector" style={{ top: y * 100 + '%', left: x * 100 + '%' }}>
      {hiddenItems.map((item) => {
        return (
          <li
            key={hiddenItems.indexOf(item)}
            onClick={() => handleGuess(item.description)}
          >
            {hiddenItems.indexOf(item) + 1}. {item.description}
          </li>
        );
      })}
    </ol>
  );
};

export default Selector;
