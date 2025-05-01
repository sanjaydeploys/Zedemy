import React, { memo, useMemo } from 'react';
import styled from 'styled-components';
import { parseLinks } from './utils';
import { FixedSizeList as List } from 'react-window';

// Shared styles
const sharedSectionStyles = `
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

// Styled components
const ComparisonTableContainer = styled.section`
  ${sharedSectionStyles}
  overflow-x: auto;
`;

const ResponsiveContent = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const ResponsiveTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  min-width: 600px;
  font-size: 0.875rem;
  table-layout: fixed;
`;

const ResponsiveHeader = styled.th`
  background: #1e293b;
  color: #ffffff;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  text-align: left;
  vertical-align: middle;
  width: ${(props) => (props.isAttribute ? '20%' : 'auto')};
`;

const ResponsiveCell = styled.td`
  border: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  vertical-align: top;
  background: ${(props) => (props.index % 2 === 0 ? '#f9fafb' : '#ffffff')};
  line-height: 1.5;
`;

const Caption = styled.caption`
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
  text-align: left;
  font-weight: 500;
`;

const ItemTitle = styled.strong`
  display: block;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
`;

const BulletList = styled.ul`
  padding-left: 1.25rem;
  margin: 0;
  list-style-type: disc;
`;

const BulletItem = styled.li`
  margin-bottom: 0.25rem;
  color: #4b5563;
`;

const ComparisonTable = memo(({ superTitles, category }) => {
  // Only render if superTitles is a non-empty array with valid data
  if (!Array.isArray(superTitles) || superTitles.length === 0 || !superTitles.some(st => st.superTitle && st.attributes?.length > 0)) {
    return null;
  }

  const parsedSuperTitles = useMemo(
    () =>
      superTitles.map((st) => ({
        ...st,
        superTitle: parseLinks(st.superTitle || '', category, true),
        attributes: (st.attributes || []).map((attr) => ({
          ...attr,
          attribute: parseLinks(attr.attribute || '', category, true),
          items: (attr.items || []).map((item) => ({
            ...item,
            title: parseLinks(item.title || 'N/A', category, true),
            bulletPoints: (item.bulletPoints || []).map((point) => parseLinks(point || 'N/A', category, true)),
          })),
        })),
      })),
    [superTitles, category]
  );

  const Row = ({ index, style }) => {
    const attr = parsedSuperTitles[0]?.attributes[index];
    if (!attr?.attribute) return null;

    return (
      <tr style={style}>
        <ResponsiveCell scope="row" index={index} dangerouslySetInnerHTML={{ __html: attr.attribute }} />
        {parsedSuperTitles.map((st, stIdx) =>
          st.attributes?.[index]?.items ? (
            <ResponsiveCell key={stIdx} index={index}>
              {(st.attributes[index].items || []).map(
                (item, itemIdx) =>
                  (item.title || item.bulletPoints?.length > 0) && (
                    <div key={itemIdx} css={{ marginBottom: '0.5rem' }}>
                      <ItemTitle dangerouslySetInnerHTML={{ __html: item.title }} />
                      {item.bulletPoints?.length > 0 && (
                        <BulletList>
                          {item.bulletPoints.map((point, pIdx) => (
                            <BulletItem key={pIdx} dangerouslySetInnerHTML={{ __html: point }} />
                          ))}
                        </BulletList>
                      )}
                    </div>
                  )
              )}
            </ResponsiveCell>
          ) : (
            <ResponsiveCell key={stIdx} index={index}>
              N/A
            </ResponsiveCell>
          )
        )}
      </tr>
    );
  };

  return (
    <ComparisonTableContainer aria-labelledby="comparison-heading">
      <h2
        id="comparison-heading"
        css={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '1rem',
          borderLeft: '4px solid #34db58',
          paddingLeft: '0.5rem',
        }}
      >
        Comparison
      </h2>
      <ResponsiveContent>
        <ResponsiveTable>
          <Caption>Comparison of {category || 'features'}</Caption>
          <thead>
            <tr>
              <ResponsiveHeader scope="col" isAttribute>
                Attribute
              </ResponsiveHeader>
              {parsedSuperTitles.map(
                (st, i) =>
                  st.superTitle && (
                    <ResponsiveHeader key={i} scope="col" dangerouslySetInnerHTML={{ __html: st.superTitle }} />
                  )
              )}
            </tr>
          </thead>
          <tbody>
            <List
              height={400}
              itemCount={parsedSuperTitles[0]?.attributes?.length || 0}
              itemSize={100}
              width="100%"
            >
              {Row}
            </List>
          </tbody>
        </ResponsiveTable>
      </ResponsiveContent>
    </ComparisonTableContainer>
  );
});

export default ComparisonTable;
