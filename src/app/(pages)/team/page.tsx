"use client";

import { Typography, Card, Avatar, Row, Col, Tag, Button } from "antd";
import {
  UserOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;
const { Meta } = Card;

const teamMembers = [
  {
    id: 1,
    name: "จอห์น โด",
    position: "Frontend Developer",
    description: "ผู้เชี่ยวชาญด้าน React และ Next.js มีประสบการณ์มากกว่า 5 ปี",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    avatar: null,
  },
  {
    id: 2,
    name: "เจน สมิธ",
    position: "Backend Developer",
    description: "ผู้เชี่ยวชาญด้าน Node.js และ Database Design",
    skills: ["Node.js", "MongoDB", "PostgreSQL", "Docker"],
    avatar: null,
  },
  {
    id: 3,
    name: "บ็อบ จอห์นสัน",
    position: "UI/UX Designer",
    description: "นักออกแบบมืออาชีพที่มีความคิดสร้างสรรค์และประสบการณ์ยาวนาน",
    skills: ["Figma", "Adobe XD", "Photoshop", "User Research"],
    avatar: null,
  },
  {
    id: 4,
    name: "อลิซ วิลสัน",
    position: "Project Manager",
    description: "ผู้จัดการโครงการที่มีประสบการณ์ในการบริหารทีมและงาน",
    skills: ["Agile", "Scrum", "Project Planning", "Team Leadership"],
    avatar: null,
  },
];

export default function Team() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Title level={1} className="mb-4">
            <UserOutlined className="mr-2" />
            ทีมงานของเรา
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
            พบกับทีมงานมืออาชีพที่มีความเชี่ยวชาญในสาขาต่างๆ
            พร้อมที่จะสร้างสรรค์โปรเจคที่ยอดเยี่ยมให้กับคุณ
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {teamMembers.map((member) => (
            <Col xs={24} sm={12} lg={6} key={member.id}>
              <Card
                className="h-full shadow-md hover:shadow-lg transition-shadow"
                cover={
                  <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Avatar
                      size={80}
                      icon={<UserOutlined />}
                      className="mb-4"
                    />
                  </div>
                }
                actions={[
                  <Button key="github" type="text" icon={<GithubOutlined />} />,
                  <Button
                    key="linkedin"
                    type="text"
                    icon={<LinkedinOutlined />}
                  />,
                  <Button key="email" type="text" icon={<MailOutlined />} />,
                ]}
              >
                <Meta
                  title={
                    <span className="text-lg font-semibold">{member.name}</span>
                  }
                  description={
                    <div>
                      <Tag color="blue" className="mb-2">
                        {member.position}
                      </Tag>
                      <Paragraph className="text-sm text-gray-600 mb-3">
                        {member.description}
                      </Paragraph>
                      <div>
                        <Paragraph className="text-xs font-semibold mb-1">
                          ทักษะ:
                        </Paragraph>
                        <div className="flex flex-wrap gap-1">
                          {member.skills.map((skill) => (
                            <Tag key={skill} size="small" color="geekblue">
                              {skill}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-12">
          <Title level={3} className="mb-4">
            สนใจร่วมงานกับเรา?
          </Title>
          <Paragraph className="text-gray-600 mb-6">
            เรากำลังมองหาคนเก่งมาร่วมทีม หากคุณมีความสามารถและมีแรงบันดาลใจ
          </Paragraph>
          <Button type="primary" size="large" icon={<MailOutlined />}>
            ติดต่อเรา
          </Button>
        </div>
      </div>
    </div>
  );
}
