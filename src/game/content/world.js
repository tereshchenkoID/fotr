const buildLocations = (entries) =>
  Object.fromEntries(
    entries.map(([id, x, y, en, ru, uk]) => [
      id,
      { id, x, y, names: { en, ru, uk } },
    ])
  )

export const locations = buildLocations([
  ['shire', 29, 30, 'The Shire', 'Шир', 'Шир'],
  ['bree', 36, 32, 'Bree', 'Бри', 'Брі'],
  ['weathertop', 42, 25, 'Weathertop', 'Заверть', 'Вивітрень'],
  ['rivendell', 51, 29, 'Rivendell', 'Ривенделл', 'Рівенділ'],
  ['moria', 54, 44, 'Moria', 'Мория', 'Морія'],
  ['lorien', 62, 47, 'Lothlórien', 'Лотлориэн', 'Лотлоріен'],
  ['amon', 66, 60, 'Amon Hen', 'Амон Хен', 'Амон Ген'],
  ['rohan', 48, 68, 'Rohan', 'Рохан', 'Роган'],
  ['helm', 41, 71, 'Helm’s Deep', 'Хельмова Падь', 'Гельмів Яр'],
  ['fangorn', 51, 58, 'Fangorn', 'Фангорн', 'Фанґорн'],
  ['minas', 65, 79, 'Minas Tirith', 'Минас Тирит', 'Мінас-Тіріт'],
  ['marshes', 75, 54, 'Dead Marshes', 'Мёртвые топи', 'Мертві болота'],
  ['ithilien', 71, 72, 'Ithilien', 'Итилиэн', 'Ітілієн'],
  ['cirith', 81, 79, 'Cirith Ungol', 'Кирит Унгол', 'Кіріт-Унґол'],
  ['mordor', 88, 80, 'Mordor', 'Мордор', 'Мордор'],
  ['doom', 87, 68, 'Mount Doom', 'Роковая гора', 'Ородруїн'],
  ['gate', 82, 57, 'Black Gate', 'Чёрные Врата', 'Чорна Брама'],
  ['trollshaws', 43, 30, 'Trollshaws', 'Троллья пуща', 'Тролячий ліс'],
  ['goblins', 57, 33, 'Goblin-town', 'Город гоблинов', 'Місто гоблінів'],
  ['cave', 58, 42, 'Gollum’s Cave', 'Пещера Голлума', 'Печера Ґолума'],
  ['mirkwood', 67, 35, 'Mirkwood', 'Лихолесье', 'Морок-ліс'],
  ['lake', 78, 24, 'Lake-town', 'Озёрный город', 'Озерне місто'],
  ['erebor', 84, 17, 'Erebor', 'Эребор', 'Еребор'],
  [
    'five',
    89,
    24,
    'Battle of Five Armies',
    'Битва Пяти Воинств',
    'Битва П’яти Воїнств',
  ],
  ['numenor', 17, 72, 'Númenor', 'Нуменор', 'Нуменор'],
  ['eregion', 48, 42, 'Eregion', 'Эрегион', 'Ереґіон'],
  ['lindon', 19, 34, 'Lindon', 'Линдон', 'Ліндон'],
  ['khazad', 54, 44, 'Khazad-dûm', 'Кхазад-дум', 'Кгазад-дум'],
  ['rhun', 89, 38, 'Rhûn', 'Рун', 'Рун'],
  ['southlands', 74, 70, 'Southlands', 'Южные земли', 'Південні землі'],
])

export const campaigns = {
  war: {
    id: 'war',
    image: '/art/war.webp',
    locationIds:
      'shire bree weathertop rivendell moria lorien amon rohan helm fangorn minas marshes ithilien cirith mordor doom gate'.split(
        ' '
      ),
  },
  hobbit: {
    id: 'hobbit',
    image: '/art/hobbit.webp',
    locationIds:
      'shire trollshaws rivendell goblins cave mirkwood lake erebor five'.split(
        ' '
      ),
  },
  power: {
    id: 'power',
    image: '/art/power.webp',
    locationIds: 'numenor eregion lindon khazad rhun southlands mordor'.split(
      ' '
    ),
  },
}

const markerGroups = {
  settlement: ['shire', 'bree', 'rivendell', 'rohan', 'minas', 'lake', 'numenor', 'lindon', 'southlands'],
  fortress: ['weathertop', 'helm', 'gate', 'erebor', 'eregion', 'khazad'],
  forest: ['lorien', 'fangorn', 'ithilien', 'trollshaws', 'mirkwood'],
  cave: ['moria', 'cirith', 'goblins', 'cave'],
  landmark: ['amon', 'marshes', 'mordor', 'doom', 'five', 'rhun'],
}

export const locationMarkers = Object.fromEntries(
  Object.entries(markerGroups).flatMap(([type, ids]) => ids.map((id) => [id, type]))
)

export const mapLabelPositions = {
  lake: 'upper-left',
  erebor: 'upper-right',
  five: 'lower-left',
}
