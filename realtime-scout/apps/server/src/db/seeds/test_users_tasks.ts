import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

const PASSWORD = '123456';

// 福州大学至诚学院周边坐标 (119.21x, 26.06x)
const testTasks = [
  {
    username: 'test01',
    nickname: '小陈同学',
    title: '帮看中六宿舍环境',
    description: '大一新生，想了解福州大学至诚学院中六宿舍的情况，拍几张走廊和阳台的照片，看看有没有独卫、空调',
    location_name: '福州大学至诚学院中六宿舍',
    lng: 119.2101,
    lat: 26.0645,
    reward: 3.00,
  },
  {
    username: 'test02',
    nickname: '吃货阿杰',
    title: '看荷叶饭排队人多不多',
    description: '想吃京元食堂一楼的荷叶饭，帮我看看现在排队的人多不多，拍一下队伍长度',
    location_name: '京元食堂一楼荷叶饭窗口',
    lng: 119.2115,
    lat: 26.0638,
    reward: 2.00,
  },
  {
    username: 'test03',
    nickname: '咖啡星人',
    title: '瑞幸联名周边还有没有',
    description: '京元食堂的瑞幸出了新的联名杯套和纸袋，帮我看看还有没有库存，顺便拍一下款式',
    location_name: '京元食堂瑞幸咖啡',
    lng: 119.2118,
    lat: 26.0635,
    reward: 2.50,
  },
  {
    username: 'test04',
    nickname: '健身达人',
    title: '帮看体育馆开了没',
    description: '想去打羽毛球，帮忙看一下体育馆今天开门没有，还有场地是否空闲',
    location_name: '至诚学院体育馆',
    lng: 119.2095,
    lat: 26.0660,
    reward: 2.00,
  },
  {
    username: 'test05',
    nickname: '图书馆钉子户',
    title: '图书馆三楼有位置吗',
    description: '考试周快到了，帮我看看图书馆三楼自习区还有没有空位，大概几成满',
    location_name: '至诚学院图书馆三楼',
    lng: 119.2108,
    lat: 26.0652,
    reward: 2.00,
  },
  {
    username: 'test06',
    nickname: '外卖选择困难',
    title: '帮看二食堂今天有什么新菜',
    description: '不想点外卖了，帮我拍一下二食堂今天的菜品，尤其是新出的菜，看看有没有想吃的',
    location_name: '至诚学院第二食堂',
    lng: 119.2122,
    lat: 26.0642,
    reward: 3.00,
  },
  {
    username: 'test07',
    nickname: '快递焦虑症',
    title: '菜鸟驿站排队长吗',
    description: '有个大件快递要取，帮我看看菜鸟驿站现在排队情况，人多的话我晚点再去',
    location_name: '至诚学院菜鸟驿站',
    lng: 119.2130,
    lat: 26.0648,
    reward: 2.00,
  },
  {
    username: 'test08',
    nickname: '社恐打印人',
    title: '文印店还在营业吗',
    description: '晚上9点了，帮我看看南门那家文印店还开着没，要打印明天交的作业',
    location_name: '南门文印店',
    lng: 119.2098,
    lat: 26.0625,
    reward: 2.50,
  },
  {
    username: 'test09',
    nickname: '奶茶续命',
    title: '古茗排队要多久',
    description: '想喝古茗的新品，帮我看看西门口那家现在排队大概要等多久',
    location_name: '西门古茗奶茶',
    lng: 119.2088,
    lat: 26.0640,
    reward: 2.00,
  },
  {
    username: 'test10',
    nickname: '跑步爱好者',
    title: '操场跑道有没有在维修',
    description: '听说操场在修跑道，帮我确认一下现在还能不能去跑步，拍个照',
    location_name: '至诚学院田径场',
    lng: 119.2092,
    lat: 26.0665,
    reward: 2.00,
  },
  {
    username: 'test11',
    nickname: '选课纠结王',
    title: '帮看教五301教室大不大',
    description: '下学期想选教五的课，帮我看看301教室环境怎么样，桌椅新不新，有没有插座',
    location_name: '教学楼五301',
    lng: 119.2105,
    lat: 26.0658,
    reward: 3.50,
  },
  {
    username: 'test12',
    nickname: '篮球少年',
    title: '篮球场有空场吗',
    description: '想打球，帮忙看看室外篮球场现在有没有空的半场，人多不多',
    location_name: '至诚学院室外篮球场',
    lng: 119.2090,
    lat: 26.0655,
    reward: 2.00,
  },
  {
    username: 'test13',
    nickname: '宿舍维修工',
    title: '看看中二宿舍楼下水房修好没',
    description: '中二宿舍一楼水房前几天坏了，帮我看看修好了没有，能不能正常用',
    location_name: '至诚学院中二宿舍',
    lng: 119.2103,
    lat: 26.0647,
    reward: 2.50,
  },
  {
    username: 'test14',
    nickname: '零食囤货党',
    title: '校内超市有没有打折活动',
    description: '听说校内超市这周有零食打折，帮我拍一下活动海报和具体折扣信息',
    location_name: '至诚学院校内超市',
    lng: 119.2112,
    lat: 26.0643,
    reward: 3.00,
  },
  {
    username: 'test15',
    nickname: '考研党小林',
    title: '帮看考研自习室有空位吗',
    description: '教学楼二楼的考研自习室，帮我看看现在还有没有位置，最好拍一下大概的空座情况',
    location_name: '教学楼二楼考研自习室',
    lng: 119.2107,
    lat: 26.0656,
    reward: 2.50,
  },
  {
    username: 'test16',
    nickname: '二手交易人',
    title: '帮看跳蚤市场还在摆摊吗',
    description: '听说今天操场旁边有跳蚤市场，帮我看看还有没有在摆，主要想看有没有卖平板的',
    location_name: '操场旁跳蚤市场',
    lng: 119.2094,
    lat: 26.0662,
    reward: 3.00,
  },
  {
    username: 'test17',
    nickname: '社团活动家',
    title: '大学生活动中心有什么活动',
    description: '帮我看看活动中心门口的公告栏，这周有什么社团活动或者讲座，拍清楚海报',
    location_name: '大学生活动中心',
    lng: 119.2100,
    lat: 26.0650,
    reward: 4.00,
  },
  {
    username: 'test18',
    nickname: '充电宝焦虑',
    title: '教学楼有没有共享充电宝',
    description: '手机快没电了，帮我看看教三一楼大厅的共享充电宝还有没有可借的',
    location_name: '教学楼三一楼大厅',
    lng: 119.2110,
    lat: 26.0654,
    reward: 2.00,
  },
  {
    username: 'test19',
    nickname: '夜宵觅食者',
    title: '南门烧烤摊出摊了没',
    description: '晚上想吃烧烤，帮我看看南门口那几家烧烤摊今晚出摊了没，顺便看看有啥新品',
    location_name: '南门口烧烤摊',
    lng: 119.2096,
    lat: 26.0622,
    reward: 2.50,
  },
  {
    username: 'test20',
    nickname: '洗衣纠结症',
    title: '看看中四洗衣房有空的洗衣机吗',
    description: '攒了一堆衣服要洗，帮看看中四宿舍一楼洗衣房现在有没有空闲的洗衣机',
    location_name: '中四宿舍洗衣房',
    lng: 119.2106,
    lat: 26.0644,
    reward: 2.00,
  },
];

export async function seed(knex: Knex): Promise<void> {
  // 获取 test 用户的 id 列表
  const testUsers = await knex('users').where('username', 'like', 'test%').select('id');
  const testUserIdList = testUsers.map((u: any) => u.id);

  if (testUserIdList.length > 0) {
    const testTaskRows = await knex('tasks').whereIn('publisher_id', testUserIdList).select('id');
    const testTaskIdList = testTaskRows.map((t: any) => t.id);

    // 按依赖顺序删除
    if (testTaskIdList.length > 0) {
      await knex('messages').whereIn('task_id', testTaskIdList).del();
      await knex('notifications').whereIn('related_task_id', testTaskIdList).del();
      await knex('transactions').whereIn('related_task_id', testTaskIdList).del();
      const subRows = await knex('submissions').whereIn('task_id', testTaskIdList).select('id');
      const subIds = subRows.map((s: any) => s.id);
      if (subIds.length > 0) {
        await knex('submission_photos').whereIn('submission_id', subIds).del();
      }
      await knex('submissions').whereIn('task_id', testTaskIdList).del();
      await knex('raw').select(1).catch(() => {}); // noop
    }

    // 清理 test 用户作为 sender/acceptor/reviewer 的关联
    await knex('messages').whereIn('sender_id', testUserIdList).del();
    await knex('reviews').whereIn('reviewer_id', testUserIdList).del();
    await knex('reviews').whereIn('reviewee_id', testUserIdList).del();
    await knex('notifications').whereIn('user_id', testUserIdList).del();
    await knex('transactions').whereIn('user_id', testUserIdList).del();
    const subRows2 = await knex('submissions').whereIn('acceptor_id', testUserIdList).select('id');
    if (subRows2.length > 0) {
      await knex('submission_photos').whereIn('submission_id', subRows2.map((s: any) => s.id)).del();
    }
    await knex('submissions').whereIn('acceptor_id', testUserIdList).del();
    await knex('tasks').whereIn('acceptor_id', testUserIdList).update({ acceptor_id: null });
    await knex('tasks').whereIn('publisher_id', testUserIdList).del();
    await knex('users').whereIn('id', testUserIdList).del();
  }

  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后

  for (const item of testTasks) {
    const [user] = await knex('users').insert({
      username: item.username,
      password_hash,
      nickname: item.nickname,
      balance: 50.00,
      total_published: 1,
    }).returning('*');

    await knex('tasks').insert({
      publisher_id: user.id,
      title: item.title,
      description: item.description,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(${item.lng}, ${item.lat}), 4326)`),
      location_name: item.location_name,
      reward: item.reward,
      photo_count: 2,
      status: 'pending',
      deadline,
    });
  }
}
