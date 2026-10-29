
function getTier(points) {
if (points >= 100) return 'HT1';
if (points >= 90) return 'LT1';
 if (points >= 80) return 'HT2';
if (points >= 70) return 'LT2';
 if (points >= 60) return 'HT3';
 if (points >= 50) return 'LT3';
 if (points >= 40) return 'HT4';
  if (points >= 30) return 'LT4';
  if (points >= 20) return 'HT5';
  if (points >= 10) return 'LT5';
    return 'ST6';
}

      module.exports = getTier;
