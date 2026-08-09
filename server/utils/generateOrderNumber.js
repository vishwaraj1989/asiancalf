let counter = 100000;
const prefix = 'AC';

function generateOrderNumber() {
  counter += 1;
  return `${prefix}${counter}`;
}

module.exports = generateOrderNumber;
